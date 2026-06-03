import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteSupportsCollectionId,
  createDocument,
  listDocuments,
  updateDocument,
} from "@/lib/appwrite";
import { notifyNewSupport } from "@/lib/notifications";

export const runtime = "nodejs";

function supportDocumentId(issueId: string, userId: string) {
  return `support-${issueId}-${userId}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 36);
}

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const { slug } = await params;

  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [`equal("slug", ["${slug}"])`, "limit(1)"]);
  const issue = (issueQuery as { documents?: Array<{ $id: string; supporter_count?: number; title?: string; created_by?: string }> }).documents?.[0];

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const supportId = supportDocumentId(issue.$id, userId);
  const supportPayload = {
    issue_id: issue.$id,
    user_id: userId,
    kind: "support",
    note: null,
  };

  const supportDoc = await createDocument(appwriteDatabaseId, appwriteSupportsCollectionId, supportId, supportPayload).catch((error) => {
    if (error instanceof Error && error.message.toLowerCase().includes("already exists")) {
      return null;
    }
    throw error;
  });

  const nextSupportCount = supportDoc ? (issue.supporter_count ?? 0) + 1 : issue.supporter_count ?? 0;

  if (supportDoc) {
    await updateDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issue.$id, {
      supporter_count: nextSupportCount,
    });

    // Send notification to issue creator
    if (issue.created_by && issue.created_by !== userId) {
      const supporterName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.username || "Someone";
      
      await notifyNewSupport(
        issue.created_by,
        "issue",
        issue.title || "your issue",
        supporterName,
        `/issues/${slug}`
      );
    }
  }

  return NextResponse.json({ ok: true, supportCount: nextSupportCount, alreadySupported: !supportDoc });
}
