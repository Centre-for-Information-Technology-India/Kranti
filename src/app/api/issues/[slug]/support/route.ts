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
      console.error("Issue support saved but count update failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    }

    // Send notification to issue creator
    if (issue.created_by && issue.created_by !== userId) {
      let user: Awaited<ReturnType<typeof currentUser>> = null;
      try {
        user = await currentUser();
      } catch {
        // The authenticated userId owns the support. The alert name is optional.
        console.warn("Issue supporter display name unavailable");
      }
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
