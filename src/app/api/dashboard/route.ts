import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
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
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load your account. Please try again." }, { status: 503 });
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await loadDashboard(userId);
  } catch (error) {
    console.error("Dashboard cases fetch error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ ok: false, error: "Your cases could not load. Please try again." }, { status: 503 });
  }
}

async function loadDashboard(userId: string) {
  const [issueDocuments, petitionDocuments] = await Promise.all([
    dashboardCasesForUser(appwriteIssuesCollectionId, appwriteSupportsCollectionId, "issue_id", userId),
    dashboardCasesForUser(appwritePetitionsCollectionId, appwriteSignaturesCollectionId, "petition_id", userId),
  ]);

  // Fetch only the profiles needed for the cases on this dashboard page.
  const creatorIds = [...new Set([...issueDocuments, ...petitionDocuments]
    .map((document) => String(document.created_by ?? document.createdBy ?? ""))
    .filter(Boolean))];
  const profileQueries = Array.from({ length: Math.ceil(creatorIds.length / 50) }, (_, index) => {
    const ids = creatorIds.slice(index * 50, (index + 1) * 50);
    return ["clerk_id", "$id"].map((field) =>
      listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [Query.equal(field, ids), Query.limit(50)])
    );
  }).flat();
  const profileResults = await Promise.allSettled(profileQueries);
  if (profileResults.some((result) => result.status === "rejected")) {
    console.warn("Dashboard creator names unavailable");
  }

  const users = profileResults.flatMap((result) => result.status === "fulfilled"
    ? (result.value as { documents?: Array<Record<string, unknown>> }).documents ?? []
    : []).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
    const clerkId = String(document.clerk_id ?? document.clerkUserId ?? document.$id ?? "");
    if (clerkId) {
      accumulator[clerkId] = document;
    }
    return accumulator;
  }, {});

  const toIssue = (document: Record<string, unknown>) => {
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
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen Reporter"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: String(document.language ?? "en"),
      createdAt: String(document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString()),
      evidence: [],
    };
  };

  const toPetition = (document: Record<string, unknown>) => {
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
      creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen"),
      creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
      language: String(document.language ?? "en"),
      featured: Boolean(document.featured ?? false),
      createdAt: String(document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString()),
      evidence: [],
    };
  };

  const isOwned = (document: Record<string, unknown>) => String(document.created_by ?? document.createdBy ?? "") === userId;
  const raisedIssues = issueDocuments.filter(isOwned).map(toIssue);
  const supportedIssues = issueDocuments.filter((document) => !isOwned(document)).map(toIssue);
  const raisedPetitions = petitionDocuments.filter(isOwned).map(toPetition);
  const signedPetitions = petitionDocuments.filter((document) => !isOwned(document)).map(toPetition);

  return NextResponse.json({
    ok: true,
    raisedIssues,
    supportedIssues,
    raisedPetitions,
    signedPetitions,
  });
}
