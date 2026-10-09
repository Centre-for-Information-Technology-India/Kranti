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
  Query,
} from "@/lib/appwrite";
import { dashboardCasesForUser } from "@/lib/dashboard-cases";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();

  const [issueDocuments, petitionDocuments] = await Promise.all([
    dashboardCasesForUser(appwriteIssuesCollectionId, appwriteSupportsCollectionId, "issue_id", userId),
    dashboardCasesForUser(appwritePetitionsCollectionId, appwriteSignaturesCollectionId, "petition_id", userId),
  ]);

  // Fetch only the profiles needed for the cases on this dashboard page.
  const creatorIds = [...new Set([...issueDocuments, ...petitionDocuments]
    .map((document) => String(document.created_by ?? document.createdBy ?? ""))
    .filter(Boolean))];
  const userResults = await Promise.all(Array.from({ length: Math.ceil(creatorIds.length / 50) }, (_, index) => {
    const ids = creatorIds.slice(index * 50, (index + 1) * 50);
    return Promise.all(["clerk_id", "$id"].map((field) =>
      listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [Query.equal(field, ids), Query.limit(50)])
    ));
  }));

  const users = userResults.flatMap((batch) => batch.flatMap((result) => (result as { documents?: Array<Record<string, unknown>> }).documents ?? [])).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
    const clerkId = String(document.clerk_id ?? document.clerkUserId ?? document.$id ?? "");
    if (clerkId) {
      accumulator[clerkId] = document;
    }
    return accumulator;
  }, {});

  const issues = issueDocuments.map((document) => {
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

  const petitions = petitionDocuments.map((document) => {
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

  const raisedIssues = issues.filter((issue) => issue.created_by === userId);
  const supportedIssues = issues.filter((issue) => issue.created_by !== userId);
  const raisedPetitions = petitions.filter((petition) => petition.created_by === userId);
  const signedPetitions = petitions.filter((petition) => petition.created_by !== userId);

  return NextResponse.json({
    ok: true,
    raisedIssues,
    supportedIssues,
    raisedPetitions,
    signedPetitions,
    profile: clerkUser,
  });
}
