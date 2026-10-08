import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwritePetitionsCollectionId,
  appwriteSignaturesCollectionId,
  createDocument,
  listDocuments,
  updateDocument,
} from "@/lib/appwrite";
import { notifyNewSignature } from "@/lib/notifications";
import { updateSignatureCountAfterSave } from "@/lib/petition-signature-count";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const { slug } = await params;

  try {
    const petitionsResponse = await listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [
      `equal("slug", ["${slug}"])`,
    ]);

    const petitionDoc = ((petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [])[0];

    if (!petitionDoc) {
      return NextResponse.json({ error: "Petition not found" }, { status: 404 });
    }

    const petitionId = String(petitionDoc.$id);
    const petitionTitle = String(petitionDoc.title || "");
    const createdBy = String(petitionDoc.created_by || "");

    const existingSignatures = await listDocuments(appwriteDatabaseId, appwriteSignaturesCollectionId, [
      `equal("petition_id", ["${petitionId}"])`,
      `equal("user_id", ["${userId}"])`,
    ]);

    if (((existingSignatures as { documents?: Array<Record<string, unknown>> }).documents ?? []).length > 0) {
      return NextResponse.json({ error: "You have already signed this petition" }, { status: 400 });
    }

    const signatureId = `signature${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);

    await createDocument(appwriteDatabaseId, appwriteSignaturesCollectionId, signatureId, {
      petition_id: petitionId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });

    const currentCount = Number(petitionDoc.signature_count ?? petitionDoc.signatureCount ?? 0);
    const countUpdated = await updateSignatureCountAfterSave(
      () => updateDocument(appwriteDatabaseId, appwritePetitionsCollectionId, petitionId, {
        signature_count: currentCount + 1,
      }),
      (error) => console.error("Petition signature saved but count update failed:", error),
    );

    // Send notification to petition creator
    if (createdBy && createdBy !== userId) {
      const signerName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.username || "Someone";
      
      await notifyNewSignature(
        createdBy,
        petitionTitle,
        signerName,
        `/petitions/${slug}`
      );
    }

    return NextResponse.json({ ok: true, countUpdated, message: "Petition signed successfully" });
  } catch (error) {
    console.error("Failed to sign petition:", error);
    return NextResponse.json({ error: "Failed to sign petition" }, { status: 500 });
  }
}
