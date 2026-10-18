import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";

import { AppwriteRequestError, appwriteCommentsCollectionId, appwriteDatabaseId, appwriteIssuesCollectionId, createDocument, listDocuments, Query } from "@/lib/appwrite";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const rawOffset = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^(0|[1-9]\d*)$/.test(rawOffset) || Number(rawOffset) > 10000) {
    return NextResponse.json({ error: "Invalid comment offset" }, { status: 400 });
  }
  const offset = Number(rawOffset);

  try {
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
  } catch (error) {
    console.error("Issue comments fetch error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Older comments could not load. Please try again." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    return await saveComment(request, context);
  } catch (error) {
    console.error("Issue comment save failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your comment was saved. Check the discussion before trying again." },
      { status: 503 },
    );
  }
}

async function saveComment(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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

  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try {
    user = await currentUser();
  } catch {
    // The authenticated user ID owns the comment. A display name is optional.
    console.warn("Issue commenter display name unavailable");
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

  return NextResponse.json({
    ok: true,
    comment: {
      $id: String(document.$id ?? ""),
      issue_id: String(document.issue_id ?? ""),
      user_name: String(document.user_name ?? "Citizen"),
      avatar_url: String(document.avatar_url ?? ""),
      content: String(document.content ?? ""),
      status: String(document.status ?? "approved"),
      createdAt: String(document.created_at ?? document.$createdAt ?? ""),
    },
  });
}
