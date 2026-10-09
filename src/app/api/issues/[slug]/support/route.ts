import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  appwriteSupportsCollectionId,
  createDocument,
  getDocument,
  incrementDocumentAttribute,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { notifyNewSupport } from "@/lib/notifications";
import { belongsToSupporter, legacySupportDocumentId, supportDocumentId } from "@/lib/support-id";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const { slug } = await params;

  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string; supporter_count?: number; title?: string; created_by?: string }> }).documents?.[0];

  if (!issue) {
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
    return NextResponse.json({ ok: true, supportCount: issue.supporter_count ?? 0, countUpdated: false, alreadySupported: true });
  }

  const supportId = supportDocumentId(issue.$id, userId);
  const supportPayload = {
    issue_id: issue.$id,
    user_id: userId,
    kind: "support",
    note: null,
  };

  const supportDoc = await createDocument(appwriteDatabaseId, appwriteSupportsCollectionId, supportId, supportPayload).catch(async (error) => {
    if (!(error instanceof AppwriteRequestError) || error.status !== 409) throw error;
    const existing = await getDocument(appwriteDatabaseId, appwriteSupportsCollectionId, supportId) as Record<string, unknown>;
    if (!belongsToSupporter(existing, issue.$id, userId)) throw error;
    return null;
  });

  let supportCount = issue.supporter_count ?? 0;
  let countUpdated = false;
  let notificationSaved: boolean | null = null;

  if (supportDoc) {
    try {
      const updatedIssue = await incrementDocumentAttribute(appwriteDatabaseId, appwriteIssuesCollectionId, issue.$id, "supporter_count") as { supporter_count?: number };
      supportCount = updatedIssue.supporter_count ?? supportCount + 1;
      countUpdated = true;
    } catch (error) {
      // The support is already saved. Keep the response successful so a retry cannot mislead the citizen.
      console.error("Issue support saved but count update failed:", error);
    }

    // Send notification to issue creator
    if (issue.created_by && issue.created_by !== userId) {
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

  return NextResponse.json({ ok: true, supportCount, countUpdated, notificationSaved, alreadySupported: !supportDoc });
}
