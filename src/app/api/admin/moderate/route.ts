import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteModerationLogsCollectionId,
  createDocument,
  updateDocument,
} from "@/lib/appwrite";
import { getUserRole } from "@/lib/role-lookup";
import { verifiedPrimaryEmail } from "@/lib/account-sync";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";

export const runtime = "nodejs";

type ModerationAction = "approve" | "reject" | "escalate" | "resolve";

const ACTION_STATUS_MAP: Record<ModerationAction, string> = {
  approve: "open",
  reject: "rejected",
  escalate: "escalated",
  resolve: "resolved",
};

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is admin or moderator in Appwrite
  let role: string;
  try {
    role = await getUserRole(userId, null, undefined, async () => {
      const user = await currentUser();
      if (!user) throw new Error("Clerk user unavailable");
      return verifiedPrimaryEmail(user);
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

  if (reason !== undefined && typeof reason !== "string") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const validActions: ModerationAction[] = ["approve", "reject", "escalate", "resolve"];
  if (!validActions.includes(action as ModerationAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = ACTION_STATUS_MAP[action as ModerationAction];

  // Update issue status
  try {
    await updateDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issueId, {
      status: newStatus,
    });
  } catch (error) {
    console.error("Moderation status update failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Could not confirm the action. Refresh the issue before trying again." }, { status: 503 });
  }

  // Write moderation log (action enum: flag/hide/delete/ban/restore/escalate/approve/reject)
  // Map 'resolve' to 'approve' since DB enum doesn't have 'resolve'
  const dbAction = action === "resolve" ? "approve" : action;
  const logId = `log${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.slice(0, 32);
  try {
    await createDocument(appwriteDatabaseId, appwriteModerationLogsCollectionId, logId, {
      action: dbAction,
      admin_id: userId,
      reason: reason || `Action: ${action} performed by moderator.`,
      content_id: issueId,
    });
  } catch (error) {
    console.error("Moderation audit write failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "The issue status may have changed, but its review record was not confirmed. Refresh it and ask an administrator to check the action before trying again." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, issueId, newStatus, action });
}
