import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteModerationLogsCollectionId,
  appwriteUsersCollectionId,
  createDocument,
  getDocument,
  listDocuments,
  Query,
  updateDocument,
} from "@/lib/appwrite";

export const runtime = "nodejs";

type ModerationAction = "approve" | "reject" | "escalate" | "resolve";

const ACTION_STATUS_MAP: Record<ModerationAction, string> = {
  approve: "open",
  reject: "rejected",
  escalate: "escalated",
  resolve: "resolved",
};

async function getCallerRole(clerkId: string): Promise<string | null> {
  try {
    const doc = await getDocument(appwriteDatabaseId, appwriteUsersCollectionId, clerkId);
    return String((doc as Record<string, unknown>).role ?? "citizen");
  } catch {
    // Try listing by clerk_id in case document ID differs
    const result = await listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
      Query.equal("clerk_id", [clerkId]),
      Query.limit(1),
    ]);
    const user = (result as { documents?: Array<Record<string, unknown>> }).documents?.[0];
    return user ? String(user.role ?? "citizen") : null;
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is admin or moderator in Appwrite
  const role = await getCallerRole(userId);
  if (role !== "admin" && role !== "moderator") {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const body = (await request.json()) as {
    issueId?: string;
    action?: string;
    reason?: string;
  };

  const { issueId, action, reason } = body;

  if (!issueId || !action) {
    return NextResponse.json({ error: "issueId and action are required" }, { status: 400 });
  }

  const validActions: ModerationAction[] = ["approve", "reject", "escalate", "resolve"];
  if (!validActions.includes(action as ModerationAction)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = ACTION_STATUS_MAP[action as ModerationAction];

  // Update issue status
  await updateDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issueId, {
    status: newStatus,
    updated_at: new Date().toISOString(),
  });

  // Write moderation log
  const logId = `log${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.slice(0, 32);
  await createDocument(appwriteDatabaseId, appwriteModerationLogsCollectionId, logId, {
    action,
    admin_id: userId,
    reason: reason || `Action: ${action} performed by moderator.`,
    content_id: issueId,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, issueId, newStatus, action });
}
