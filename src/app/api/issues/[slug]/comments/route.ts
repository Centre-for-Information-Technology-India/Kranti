import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

import { appwriteCommentsCollectionId, appwriteDatabaseId, appwriteIssuesCollectionId, createDocument, listDocuments, Query } from "@/lib/appwrite";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const rawOffset = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^(0|[1-9]\d*)$/.test(rawOffset) || Number(rawOffset) > 10000) {
    return NextResponse.json({ error: "Invalid comment offset" }, { status: 400 });
  }
  const offset = Number(rawOffset);

  const { slug } = await params;
  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string }> }).documents?.[0];

  if (!issue) {
    return NextResponse.json({ ok: true, comments: [], hasMore: false });
  }

  const commentsResponse = await listDocuments(appwriteDatabaseId, appwriteCommentsCollectionId, [
    Query.equal("issue_id", [issue.$id]),
    Query.equal("status", ["approved"]),
    Query.orderAsc("$createdAt"),
    Query.limit(100),
    Query.offset(offset),
  ]);

  const comments = ((commentsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((document) => ({
    $id: String(document.$id ?? ""),
    issue_id: String(document.issue_id ?? ""),
    user_name: String(document.user_name ?? "Citizen"),
    avatar_url: String(document.avatar_url ?? ""),
    content: String(document.content ?? ""),
    status: String(document.status ?? "approved"),
    createdAt: String(document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString()),
  }));

  const total = Number((commentsResponse as { total?: number }).total ?? 0);
  return NextResponse.json({ ok: true, comments, hasMore: offset + comments.length < total && offset + comments.length <= 10000 });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const { slug } = await params;
  let payload: unknown;
  try {
    payload = await readJsonWithLimit(request, 1024 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Comment is too large. Shorten it and try again." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid comment details" }, { status: 400 });
  }

  const details = payload as Record<string, unknown>;
  if (typeof details.content !== "string" || (details.language !== undefined && typeof details.language !== "string")) {
    return NextResponse.json({ error: "Invalid comment details" }, { status: 400 });
  }
  const content = details.content.trim();

  if (!content) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string }> }).documents?.[0];

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const commentId = `comment-${ID.unique()}`;
  const document = await createDocument(appwriteDatabaseId, appwriteCommentsCollectionId, commentId, {
    issue_id: issue.$id,
    user_id: userId,
    user_name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Citizen",
    avatar_url: user?.imageUrl ?? null,
    content,
    status: "approved",
    language: details.language ?? "en",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, comment: document });
}
