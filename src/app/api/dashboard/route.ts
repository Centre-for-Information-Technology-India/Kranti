import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwritePetitionsCollectionId,
  appwriteSupportsCollectionId,
  appwriteSignaturesCollectionId,
  appwriteUsersCollectionId,
  listDocuments,
} from "@/lib/appwrite";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();

  const [issuesResponse, petitionsResponse, supportsResponse, signaturesResponse, usersResponse] = await Promise.all([
    listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, ["orderDesc(\"created_at\")"]),
    listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, ["orderDesc(\"created_at\")"]),
    listDocuments(appwriteDatabaseId, appwriteSupportsCollectionId, [`equal("user_id", ["${userId}"])`]),
    listDocuments(appwriteDatabaseId, appwriteSignaturesCollectionId, [`equal("user_id", ["${userId}"])`]),
    listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, []),
  ]);

  const users = ((usersResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
    const clerkId = String(document.clerk_id ?? document.clerkUserId ?? document.$id ?? "");
    if (clerkId) {
      accumulator[clerkId] = document;
    }
    return accumulator;
  }, {});

  const issues = ((issuesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((document) => {
    const creator = users[String(document.created_by ?? document.createdBy ?? "")];

    return {
      $id: String(document.$id ?? ""),
      title: String(document.title ?? "Untitled issue"),
      slug: String(document.slug ?? ""),
      description: String(document.description ?? ""),
      category: String(document.category ?? "general"),
      state: String(document.state ?? ""),
      district: String(document.district ?? ""),
      status: String(document.status ?? "pending_review"),
      supporter_count: Number(document.supporter_count ?? document.supportCount ?? 0),
      evidence_count: Number(document.evidence_count ?? document.evidenceCount ?? 0),
      created_by: String(document.created_by ?? document.createdBy ?? ""),
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen Reporter"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: String(document.language ?? "en"),
      createdAt: String(document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString()),
      evidence: [],
    };
  });

  const petitions = ((petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((document) => {
    const creator = users[String(document.created_by ?? document.createdBy ?? "")];

    return {
      $id: String(document.$id ?? ""),
      title: String(document.title ?? "Untitled petition"),
      slug: String(document.slug ?? ""),
      description: String(document.description ?? ""),
      demand: String(document.demand ?? ""),
      targetAuthority: String(document.target_authority ?? document.targetAuthority ?? ""),
      category: String(document.category ?? "policy_change"),
      state: String(document.state ?? ""),
      district: String(document.district ?? ""),
      status: String(document.status ?? "pending_review"),
      signature_count: Number(document.signature_count ?? document.signatureCount ?? 0),
      signature_goal: Number(document.signature_goal ?? document.signatureGoal ?? 1000),
      evidence_count: Number(document.evidence_count ?? document.evidenceCount ?? 0),
      created_by: String(document.created_by ?? document.createdBy ?? ""),
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: String(document.language ?? "en"),
      featured: Boolean(document.featured ?? false),
      createdAt: String(document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString()),
      evidence: [],
    };
  });

  const supportedIssueIds = new Set<string>(((supportsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((supportDocument) => String(supportDocument.issue_id ?? "")).filter(Boolean));
  const signedPetitionIds = new Set<string>(((signaturesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((signatureDocument) => String(signatureDocument.petition_id ?? "")).filter(Boolean));

  const raisedIssues = issues.filter((issue) => issue.created_by === userId);
  const supportedIssues = issues.filter((issue) => supportedIssueIds.has(issue.$id) && issue.created_by !== userId);
  const raisedPetitions = petitions.filter((petition) => petition.created_by === userId);
  const signedPetitions = petitions.filter((petition) => signedPetitionIds.has(petition.$id) && petition.created_by !== userId);

  return NextResponse.json({
    ok: true,
    raisedIssues,
    supportedIssues,
    raisedPetitions,
    signedPetitions,
    profile: clerkUser,
  });
}
