import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteModerationLogsCollectionId,
  createDatabaseTransaction,
  finishDatabaseTransaction,
  getDocument,
  stageDatabaseOperations,
} from "@/lib/appwrite";
import { getUserRole } from "@/lib/role-lookup";
import { verifiedPrimaryEmailForAccount } from "@/lib/account-sync";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

type ModerationAction = "approve" | "reject" | "escalate" | "resolve";

const ACTION_STATUS_MAP: Record<ModerationAction, string> = {
  approve: "open",
  reject: "rejected",
  escalate: "escalated",
  resolve: "resolved",
};

export async function POST(request: Request) {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is admin or moderator in Appwrite
  let role: string;
  try {
    role = await getUserRole(userId, null, undefined, async () => {
      const user = await currentUser();
      if (!user) throw new Error("Clerk user unavailable");
      return verifiedPrimaryEmailForAccount(user, userId);
    });
  } catch {
    return NextResponse.json({ error: "Unable to check your role. Please try again." }, { status: 503 });
  }
  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  let body: {
    issueId?: string;
    action?: string;
    reason?: string;
  };
  try {
    body = (await readJsonWithLimit(request, 1024 * 1024)) as typeof body;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Moderation details are too large. Shorten the reason and try again." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { issueId, action, reason } = body ?? {};

  if (typeof issueId !== "string" || !issueId.trim() || typeof action !== "string" || !action) {
    return NextResponse.json({ error: "issueId and action are required" }, { status: 400 });
  }

  // Appwrite document IDs are at most 36 characters and start with a letter or digit.
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(issueId)) {
    return NextResponse.json({ error: "Invalid issue ID" }, { status: 400 });
  }

  if (reason !== undefined && typeof reason !== "string") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const validActions: ModerationAction[] = ["approve", "reject", "escalate", "resolve"];
  if (!validActions.includes(action as ModerationAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = ACTION_STATUS_MAP[action as ModerationAction];

  // A repeated review must not write another audit entry or creator alert.
  let issue: { status?: unknown; created_by?: unknown; slug?: unknown };
  try {
    issue = await getDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issueId) as typeof issue;
    if (issue.status === newStatus) {
      return NextResponse.json({ error: "This issue already has that status. Refresh it before another review." }, { status: 409 });
    }
    if (issue.status === "pending_review" && action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Review this issue before changing its public status." }, { status: 409 });
    }
  } catch (error) {
    console.error("Moderation status check failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Could not confirm the issue status. Refresh it before trying again." }, { status: 503 });
  }

  // Write moderation log (action enum: flag/hide/delete/ban/restore/escalate/approve/reject)
  // Map 'resolve' to 'approve' since DB enum doesn't have 'resolve'
  const dbAction = action === "resolve" ? "approve" : action;
  const logId = `log${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.slice(0, 32);
  const logData = {
      action: dbAction,
      admin_id: userId,
      reason: action === "resolve"
        ? `Action: resolve. ${reason || "Moderator marked the issue resolved."}`
        : reason || `Action: ${action} performed by moderator.`,
      content_id: issueId,
  };
  // The status must never change without its review record.
  let transactionId: string | null = null;
  let commitStarted = false;
  try {
    const transaction = await createDatabaseTransaction();
    transactionId = transaction.$id;
    await stageDatabaseOperations(transactionId, [
      { action: "update", databaseId: appwriteDatabaseId, collectionId: appwriteIssuesCollectionId, documentId: issueId, data: { status: newStatus } },
      { action: "create", databaseId: appwriteDatabaseId, collectionId: appwriteModerationLogsCollectionId, documentId: logId, data: logData },
    ]);
    commitStarted = true;
    await finishDatabaseTransaction(transactionId, true);
  } catch (error) {
    if (transactionId && !commitStarted) {
      try {
        await finishDatabaseTransaction(transactionId, false);
      } catch {
        console.warn("Uncommitted moderation transaction rollback failed");
      }
    }
    console.error("Moderation transaction failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Could not confirm the review. Refresh the issue and check its review record before trying again." }, { status: 503 });
  }

  // The review is complete even if its secondary creator alert cannot be saved.
  let notificationSaved: boolean | null = null;
  try {
    const creatorId = typeof issue.created_by === "string" ? issue.created_by : "";
    const issueSlug = typeof issue.slug === "string" ? issue.slug : "";
    if (creatorId) {
      notificationSaved = await createNotification({
        userId: creatorId,
        type: "moderation",
        title: "Issue review updated",
        message: `Your issue status is now ${newStatus.replaceAll("_", " ")}.`,
        link: issueSlug ? `/issues/${encodeURIComponent(issueSlug)}` : undefined,
      });
    }
  } catch (error) {
    notificationSaved = false;
    console.error("Moderation creator alert failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
  }

  return NextResponse.json({ ok: true, issueId, newStatus, action, notificationSaved });
}
