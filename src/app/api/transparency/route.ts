import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteIssuesCollectionId,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { publicIssueStatuses } from "@/lib/public-issue-status";

export const runtime = "nodejs";

/**
 * GET /api/transparency
 *
 * Returns real aggregate counts from Appwrite for the public Transparency
 * dashboard. Figures that cannot be derived from platform data (moderation
 * turnaround, accuracy, funding breakdowns) are intentionally omitted — the
 * page renders "Public beta" / unavailable states for those instead of
 * invented numbers.
 */
export async function GET() {
  try {
    // Count only published issues, so unreviewed or rejected reports stay out of public figures.
    const [allIssues, resolvedIssues] = await Promise.all([
      listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [
        Query.equal("status", [...publicIssueStatuses]),
        Query.limit(1),
      ]),
      listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [
        Query.equal("status", ["resolved"]),
        Query.limit(1),
      ]),
    ]);

    return NextResponse.json({
      available: true,
      totalIssues: Number(allIssues.total ?? 0),
      resolvedIssues: Number(resolvedIssues.total ?? 0),
    });
  } catch (error) {
    console.error(
      "Transparency aggregate query failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json({ available: false });
  }
}
