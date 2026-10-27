import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwritePetitionsCollectionId,
  appwriteSignaturesCollectionId,
  createDatabaseTransaction,
  finishDatabaseTransaction,
  getDocument,
  listDocuments,
  Query,
  stageDatabaseOperations,
} from "@/lib/appwrite";
import { notifyNewSignature } from "@/lib/notifications";
import { belongsToSigner, signatureDocumentId } from "@/lib/petition-signature";
import { canSignPetition } from "@/lib/petition-signing-status";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    let userId: string | null;
    try {
      ({ userId } = await auth());
    } catch {
      return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const petitionsResponse = await listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [
      Query.equal("slug", [slug]),
      Query.limit(1),
    ]);

    const petitionDoc = ((petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [])[0];

    if (!petitionDoc) {
      return NextResponse.json({ error: "Petition not found" }, { status: 404 });
    }

    if (!canSignPetition(petitionDoc.status)) {
      return NextResponse.json({ error: "This petition is not open for signatures." }, { status: 409 });
    }

    const petitionId = String(petitionDoc.$id);
    const petitionTitle = String(petitionDoc.title || "");
    const createdBy = String(petitionDoc.created_by || "");

    const existingSignatures = await listDocuments(appwriteDatabaseId, appwriteSignaturesCollectionId, [
      Query.equal("petition_id", [petitionId]),
      Query.equal("user_id", [userId]),
      Query.limit(1),
    ]);

    if (((existingSignatures as { documents?: Array<Record<string, unknown>> }).documents ?? []).length > 0) {
      return NextResponse.json({ ok: true, alreadySigned: true, countUpdated: false, notificationSaved: null });
    }

    const signatureId = signatureDocumentId(petitionId, userId);

    let signatureSavedNow = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const transaction = await createDatabaseTransaction();
      let commitStarted = false;
      try {
        await stageDatabaseOperations(transaction.$id, [
          { action: "create", databaseId: appwriteDatabaseId, collectionId: appwriteSignaturesCollectionId, documentId: signatureId,
            data: { petition_id: petitionId, user_id: userId, created_at: new Date().toISOString() } },
          { action: "increment", databaseId: appwriteDatabaseId, collectionId: appwritePetitionsCollectionId, documentId: petitionId,
            data: { attribute: "signature_count", value: 1 } },
        ]);
        commitStarted = true;
        await finishDatabaseTransaction(transaction.$id, true);
        signatureSavedNow = true;
        break;
      } catch (error) {
        if (!commitStarted) {
          try {
            await finishDatabaseTransaction(transaction.$id, false);
          } catch {
            console.warn("Uncommitted petition signature transaction rollback failed");
          }
        }
        // A lost commit response is ambiguous. A matching signature proves that
        // the atomic transaction committed, so a retry must not increment again.
        let existing: Record<string, unknown> | null = null;
        try {
          existing = await getDocument(appwriteDatabaseId, appwriteSignaturesCollectionId, signatureId) as Record<string, unknown>;
        } catch (readError) {
          if (!(readError instanceof AppwriteRequestError) || readError.status !== 404) throw readError;
        }
        if (existing) {
          if (!belongsToSigner(existing, petitionId, userId)) throw error;
          break;
        }
        if (!(error instanceof AppwriteRequestError) || error.status !== 409 || attempt === 2) throw error;
        const latestPetition = await getDocument(appwriteDatabaseId, appwritePetitionsCollectionId, petitionId) as { status?: string };
        if (!canSignPetition(latestPetition.status)) {
          return NextResponse.json({ error: "This petition is not open for signatures." }, { status: 409 });
        }
      }
    }

    // The signature is saved even if the creator's alert fails.
    let notificationSaved: boolean | null = null;
    if (signatureSavedNow && createdBy && createdBy !== userId) {
      let user: Awaited<ReturnType<typeof currentUser>> = null;
      try {
        user = await currentUser();
      } catch {
        // The verified Clerk userId already owns the signature. A display name is optional.
        console.warn("Petition signer display name unavailable");
      }
      // Only the authenticated account may supply the optional alert name.
      if (user?.id !== userId) user = null;
      const signerName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.username || "Someone";
      
      notificationSaved = await notifyNewSignature(
        createdBy,
        petitionTitle,
        signerName,
        `/petitions/${slug}`
      );
    }

    return NextResponse.json({ ok: true, alreadySigned: !signatureSavedNow, countUpdated: signatureSavedNow, notificationSaved,
      message: signatureSavedNow ? "Petition signed successfully" : "You already signed this petition." });
  } catch (error) {
    console.error("Petition signing failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your signature was saved. Check this petition before trying again." },
      { status: 503 },
    );
  }
}
