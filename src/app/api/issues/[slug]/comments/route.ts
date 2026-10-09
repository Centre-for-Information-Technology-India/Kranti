import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { appwriteCommentsCollectionId, appwriteDatabaseId, appwriteIssuesCollectionId, createDocument, listDocuments, Query } from "@/lib/appwrite";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string }> }).documents?.[0];

  if (!issue) {
    return NextResponse.json({ ok: true, comments: [] });
  }

  const commentsResponse = await listDocuments(appwriteDatabaseId, appwriteCommentsCollectionId, [
    Query.equal("issue_id", [issue.$id]),
    Query.equal("status", ["approved"]),
    Query.orderAsc("created_at"),
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

  return NextResponse.json({ ok: true, comments });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const { slug } = await params;
  const payload = (await request.json()) as { content?: string; language?: string };
  const content = payload.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  const issueQuery = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [Query.equal("slug", [slug]), Query.limit(1)]);
  const issue = (issueQuery as { documents?: Array<{ $id: string }> }).documents?.[0];

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const commentId = `comment-${issue.$id}-${userId}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 36);
  const document = await createDocument(appwriteDatabaseId, appwriteCommentsCollectionId, commentId, {
    issue_id: issue.$id,
    user_id: userId,
    user_name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Citizen",
    avatar_url: user?.imageUrl ?? null,
    content,
    status: "approved",
    language: payload.language ?? "en",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, comment: document });
}
