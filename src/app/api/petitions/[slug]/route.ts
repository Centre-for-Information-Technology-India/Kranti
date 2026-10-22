import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwritePetitionsCollectionId,
  appwriteSignaturesCollectionId,
  appwriteEvidenceCollectionId,
  appwriteUsersCollectionId,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { isPublicPetitionStatus } from "@/lib/public-petition-status";
import { publicEvidenceWebUrl } from "@/lib/evidence";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Signing state is optional on a public petition. A Clerk outage must not
  // prevent citizens from reading the petition itself.
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    console.warn("Petition signing state unavailable");
  }

  try {
    const petitionsResponse = await listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [
      Query.equal("slug", [slug]),
      Query.limit(1),
    ]);

    const petitionDoc = ((petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [])[0];

    if (!petitionDoc || !isPublicPetitionStatus(petitionDoc.status)) {
      return NextResponse.json({ error: "Petition not found" }, { status: 404 });
    }

    const createdBy = String(petitionDoc.created_by ?? petitionDoc.createdBy ?? "");
    const [evidenceResult, userResults] = await Promise.all([
      (async () => {
        const documents: Array<Record<string, unknown>> = [];
        let unavailable = false;
        try {
          for (let page = 0; page < 10; page++) {
            const response = await listDocuments(appwriteDatabaseId, appwriteEvidenceCollectionId, [
              Query.equal("issue_id", [String(petitionDoc.$id)]),
              Query.orderAsc("$id"),
              Query.limit(100),
              Query.offset(page * 100),
            ]);
            const pageDocuments = (response as { documents?: Array<Record<string, unknown>> }).documents ?? [];
            documents.push(...pageDocuments);
            if (pageDocuments.length < 100) break;
            if (page === 9) unavailable = true;
          }
        } catch (error) {
          unavailable = true;
          console.warn("Petition evidence unavailable:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
        }
        return { documents, unavailable };
      })(),
      createdBy ? Promise.allSettled(["clerk_id", "$id"].map((field) =>
        listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [Query.equal(field, [createdBy]), Query.limit(1)])
      )) : Promise.resolve([]),
    ]);

    const users = userResults.flatMap((result) =>
      result.status === "fulfilled"
        ? (result.value as { documents?: Array<Record<string, unknown>> }).documents ?? []
        : []
    ).reduce<Record<string, Record<string, unknown>>>((acc, doc) => {
      const linkedIds = [doc.clerk_id, doc.clerkUserId]
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      if (new Set(linkedIds).size > 1) return acc;
      const ownerId = linkedIds[0] ?? doc.$id;
      if (typeof ownerId === "string" && ownerId.length > 0) acc[ownerId] = doc;
      return acc;
    }, {});

    const evidenceByPetition = evidenceResult.documents.reduce<Record<string, Array<Record<string, unknown>>>>((acc, doc) => {
      const petitionId = String(doc.issue_id ?? doc.issueId ?? "");
      if (!petitionId) return acc;
      acc[petitionId] = acc[petitionId] ?? [];
      acc[petitionId].push(doc);
      return acc;
    }, {});

    const creator = users[createdBy];
    const petitionEvidence = evidenceByPetition[String(petitionDoc.$id ?? "")] ?? [];

    const petition = {
      $id: petitionDoc.$id,
      title: petitionDoc.title,
      slug: petitionDoc.slug,
      description: petitionDoc.description,
      demand: petitionDoc.demand,
      targetAuthority: petitionDoc.target_authority ?? petitionDoc.targetAuthority,
      category: petitionDoc.category,
      state: petitionDoc.state,
      district: petitionDoc.district,
      status: petitionDoc.status,
      signature_count: Number(petitionDoc.signature_count ?? petitionDoc.signatureCount ?? 0),
      signature_goal: Number(petitionDoc.signature_goal ?? petitionDoc.signatureGoal ?? 1000),
      evidence_count: Number(petitionDoc.evidence_count ?? petitionDoc.evidenceCount ?? petitionEvidence.length),
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: petitionDoc.language ?? "en",
      featured: Boolean(petitionDoc.featured ?? false),
      createdAt: petitionDoc.created_at ?? petitionDoc.createdAt ?? petitionDoc.$createdAt ?? new Date().toISOString(),
      evidence: petitionEvidence.map((item) => ({
        fileId: String(item.$id ?? ""),
        name: "Evidence",
        size: Number(item.size_bytes ?? item.fileSize ?? 0),
        mimeType: String(item.type ?? "application/octet-stream"),
        publicUrl: publicEvidenceWebUrl(item.file_url ?? item.publicUrl),
        sanitized: Boolean(item.verified ?? false),
      })),
    };

    let hasSigned = false;
    if (userId) {
      try {
        const signaturesResponse = await listDocuments(appwriteDatabaseId, appwriteSignaturesCollectionId, [
          Query.equal("petition_id", [String(petition.$id)]),
          Query.equal("user_id", [userId]),
          Query.limit(1),
        ]);
        hasSigned = ((signaturesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).length > 0;
      } catch (error) {
        console.warn("Petition signing state unavailable:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
      }
    }

    return NextResponse.json({ ok: true, petition, hasSigned, evidenceUnavailable: evidenceResult.unavailable });
  } catch (error) {
    console.error("Failed to fetch petition:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Petition could not load. Please try again." }, { status: 503 });
  }
}
