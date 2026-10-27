import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteSupportsCollectionId,
  createDatabaseTransaction,
  finishDatabaseTransaction,
  getDocument,
  listDocuments,
  Query,
  stageDatabaseOperations,
} from "@/lib/appwrite";
import { notifyNewSupport } from "@/lib/notifications";
import { belongsToSupporter, legacySupportDocumentId, supportDocumentId } from "@/lib/support-id";
import { isPublicIssueStatus } from "@/lib/public-issue-status";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    return await saveSupport(request, context);
  } catch (error) {
    console.error("Issue support failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your support was saved. Check this issue before trying again." },
      { status: 503 },
    );
  }
}

async function saveSupport(_: Request, { params }: { params: Promise<{ slug: string }> }) {
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

  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string; status?: string; supporter_count?: number; title?: string; created_by?: string }> }).documents?.[0];

  if (!issue || !isPublicIssueStatus(issue.status)) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const legacyId = legacySupportDocumentId(issue.$id, userId);
  let legacySupport: Record<string, unknown> | null = null;
  try {
    legacySupport = await getDocument(appwriteDatabaseId, appwriteSupportsCollectionId, legacyId) as Record<string, unknown>;
  } catch (error) {
    if (!(error instanceof AppwriteRequestError) || error.status !== 404) throw error;
  }

  if (legacySupport && belongsToSupporter(legacySupport, issue.$id, userId)) {
    return NextResponse.json({ ok: true, supportCount: issue.supporter_count ?? 0, countUpdated: false, notificationSaved: null, alreadySupported: true });
  }

  const supportId = supportDocumentId(issue.$id, userId);
  const supportPayload = {
    issue_id: issue.$id,
    user_id: userId,
    kind: "support",
    note: null,
  };

  let supportSavedNow = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const transaction = await createDatabaseTransaction();
    let commitStarted = false;
    try {
      await stageDatabaseOperations(transaction.$id, [
        { action: "create", databaseId: appwriteDatabaseId, collectionId: appwriteSupportsCollectionId, documentId: supportId, data: supportPayload },
        { action: "increment", databaseId: appwriteDatabaseId, collectionId: appwriteIssuesCollectionId, documentId: issue.$id, data: { attribute: "supporter_count", value: 1 } },
      ]);
      commitStarted = true;
      await finishDatabaseTransaction(transaction.$id, true);
      supportSavedNow = true;
      break;
    } catch (error) {
      if (!commitStarted) {
        try {
          await finishDatabaseTransaction(transaction.$id, false);
        } catch {
          // The staged transaction expires without a commit, but record the failed cleanup.
          console.warn("Uncommitted issue support transaction rollback failed");
        }
      }
      // A lost commit response is ambiguous. The unique support ID proves whether
      // the atomic transaction committed; never increment a confirmed repeat.
      let existing: Record<string, unknown> | null = null;
      try {
        existing = await getDocument(appwriteDatabaseId, appwriteSupportsCollectionId, supportId) as Record<string, unknown>;
      } catch (readError) {
        if (!(readError instanceof AppwriteRequestError) || readError.status !== 404) throw readError;
      }
      if (existing) {
        if (!belongsToSupporter(existing, issue.$id, userId)) throw error;
        break;
      }
      if (!(error instanceof AppwriteRequestError) || error.status !== 409 || attempt === 2) throw error;
      const latestIssue = await getDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issue.$id) as { status?: string };
      if (!isPublicIssueStatus(latestIssue.status)) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
  }

  // A count read may fail after a confirmed commit. The support still stands.
  let supportCount: number | undefined;
  try {
    const currentIssue = await getDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issue.$id) as { supporter_count?: number };
    supportCount = currentIssue.supporter_count;
  } catch {
    supportCount = undefined;
  }
  let notificationSaved: boolean | null = null;

  if (supportSavedNow) {
    // Send notification to issue creator
    if (issue.created_by && issue.created_by !== userId) {
      let user: Awaited<ReturnType<typeof currentUser>> = null;
      try {
        user = await currentUser();
      } catch {
        // The authenticated userId owns the support. The alert name is optional.
        console.warn("Issue supporter display name unavailable");
      }
      // Clerk auth owns the action; an optional profile may supply only its own name.
      if (user?.id !== userId) user = null;
      const supporterName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.username || "Someone";
      
      notificationSaved = await notifyNewSupport(
        issue.created_by,
        "issue",
        issue.title || "your issue",
        supporterName,
        `/issues/${slug}`
      );
    }
  }

  return NextResponse.json({ ok: true, supportCount, countUpdated: true, notificationSaved, alreadySupported: !supportSavedNow });
}
