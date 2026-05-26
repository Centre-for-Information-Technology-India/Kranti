import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwritePetitionsCollectionId,
  appwriteSignaturesCollectionId,
  appwriteEvidenceCollectionId,
  appwriteUsersCollectionId,
  listDocuments,
} from "@/lib/appwrite";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  const { slug } = await params;

  try {
    const [petitionsResponse, evidenceResponse, usersResponse] = await Promise.all([
      listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [`equal("slug", ["${slug}"])`, "limit(1)"]),
      listDocuments(appwriteDatabaseId, appwriteEvidenceCollectionId, []),
      listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, []),
    ]);

    const petitionDoc = ((petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [])[0];

    if (!petitionDoc) {
      return NextResponse.json({ error: "Petition not found" }, { status: 404 });
    }

    const users = ((usersResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Record<string, unknown>>>((acc, doc) => {
      const clerkId = String(doc.clerk_id ?? doc.clerkUserId ?? doc.$id ?? "");
      if (clerkId) acc[clerkId] = doc;
      return acc;
    }, {});

    const evidenceByPetition = ((evidenceResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Array<Record<string, unknown>>>>((acc, doc) => {
      const petitionId = String(doc.issue_id ?? doc.issueId ?? "");
      if (!petitionId) return acc;
      acc[petitionId] = acc[petitionId] ?? [];
      acc[petitionId].push(doc);
      return acc;
    }, {});

    const createdBy = String(petitionDoc.created_by ?? petitionDoc.createdBy ?? "");
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
      created_by: createdBy,
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: petitionDoc.language ?? "en",
      featured: Boolean(petitionDoc.featured ?? false),
      createdAt: petitionDoc.created_at ?? petitionDoc.createdAt ?? petitionDoc.$createdAt ?? new Date().toISOString(),
      evidence: petitionEvidence.map((item) => ({
        fileId: String(item.$id ?? ""),
        name: String(item.file_name ?? item.fileName ?? "Evidence"),
        size: Number(item.size_bytes ?? item.fileSize ?? 0),
        mimeType: String(item.type ?? "application/octet-stream"),
        publicUrl: String(item.file_url ?? item.publicUrl ?? ""),
        sanitized: Boolean(item.verified ?? false),
      })),
    };

    let hasSigned = false;
    if (userId) {
      const signaturesResponse = await listDocuments(appwriteDatabaseId, appwriteSignaturesCollectionId, [
        `equal("petition_id", ["${petition.$id}"])`,
        `equal("user_id", ["${userId}"])`,
      ]);
      hasSigned = ((signaturesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).length > 0;
    }

    return NextResponse.json({ ok: true, petition, hasSigned });
  } catch (error) {
    console.error("Failed to fetch petition:", error);
    return NextResponse.json({ error: "Failed to fetch petition" }, { status: 500 });
  }
}
