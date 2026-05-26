import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  appwriteStorageBucketId,
  appwriteDatabaseId,
  appwriteEvidenceCollectionId,
  appwriteIssuesCollectionId,
  appwriteUsersCollectionId,
  createDocument,
  deleteFile,
  downloadFile,
  getFileViewUrl,
  listDocuments,
  upsertDocument,
  uploadFileBuffer,
} from "@/lib/appwrite";
import { buildIssueSlug, issueSubmissionSchema } from "@/lib/issue-form";
import { detectEvidenceType } from "@/lib/evidence";

export const runtime = "nodejs";

function safeFileId(seed: string) {
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || `file${Date.now()}`;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "Unable to load Clerk user" }, { status: 400 });
  }

  const body = (await request.json()) as {
    payload?: unknown;
    evidence?: Array<{
      fileId: string;
      name: string;
      size: number;
      mimeType: string;
      publicUrl?: string;
    }>;
  };

  const submission = issueSubmissionSchema.parse(body.payload);
  const evidenceFiles = Array.isArray(body.evidence) ? body.evidence : [];

  const issueId = `issue${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
  const issueSlug = buildIssueSlug(submission.title);
  const uploadedEvidence = [] as Array<{
    fileId: string;
    name: string;
    size: number;
    mimeType: string;
    publicUrl: string;
    originalFileId?: string;
    sanitized: boolean;
  }>;

  for (const file of evidenceFiles) {
    if (!file.fileId || !file.name || !file.size || !file.mimeType) {
      return NextResponse.json({ error: "Invalid evidence metadata" }, { status: 400 });
    }

    const isImage = file.mimeType.startsWith("image/");
    const publicUrl = file.publicUrl ?? getFileViewUrl(appwriteStorageBucketId, file.fileId);

    if (isImage) {
      const raw = Buffer.from(await downloadFile(appwriteStorageBucketId, file.fileId));
      const sanitizedBuffer = await sharp(raw).rotate().toBuffer();
      const sanitizedFileId = safeFileId(`${file.fileId}-clean`);
      const sanitizedUpload = await uploadFileBuffer(appwriteStorageBucketId, sanitizedFileId, file.name, sanitizedBuffer, file.mimeType);

      await deleteFile(appwriteStorageBucketId, file.fileId).catch(() => {
        // If deleting the raw file fails, keep the sanitized copy and continue.
      });

      uploadedEvidence.push({
        fileId: String((sanitizedUpload as { $id?: unknown }).$id ?? sanitizedFileId),
        originalFileId: file.fileId,
        name: file.name,
        size: sanitizedBuffer.byteLength,
        mimeType: file.mimeType,
        publicUrl: getFileViewUrl(appwriteStorageBucketId, sanitizedFileId),
        sanitized: true,
      });
      continue;
    }

    uploadedEvidence.push({
      fileId: file.fileId,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      publicUrl,
      sanitized: false,
    });
  }

  const issueDocument = await upsertDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issueId, {
    created_by: clerkUser.id,
    title: submission.title,
    slug: issueSlug,
    description: submission.description,
    category: submission.category,
    state: submission.state,
    district: submission.district,
    language: submission.language,
    status: "open",
    supporter_count: 0,
    risk_score: submission.evidenceLevel === "high" ? 20 : submission.evidenceLevel === "medium" ? 40 : 60,
    evidence_count: uploadedEvidence.length,
    featured: false,
    visibility: "public",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  for (const evidenceItem of uploadedEvidence) {
    const evidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    void createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, evidenceId, {
      issue_id: issueId,
      type: detectEvidenceType(evidenceItem.mimeType),
      file_url: evidenceItem.publicUrl,
      file_name: evidenceItem.name,
      size_bytes: evidenceItem.size,
      verified: false,
      created_at: new Date().toISOString(),
    }).catch(() => {});
  }

  // Store evidence links
  const evidenceLinks = Array.isArray(submission.evidenceLinks) ? submission.evidenceLinks.filter(Boolean) : [];
  for (const link of evidenceLinks) {
    const linkEvidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    void createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, linkEvidenceId, {
      issue_id: issueId,
      type: "other",
      file_url: link,
      source_url: link,
      file_name: new URL(link).hostname,
      size_bytes: 0,
      verified: false,
      created_at: new Date().toISOString(),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    issueId,
    issueSlug,
    issueDocument,
    uploadedEvidence,
  });
}

export async function GET() {
  try {
    const [issuesResponse, evidenceResponse, usersResponse] = await Promise.all([
      listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, ["orderDesc(\"created_at\")"]),
      listDocuments(appwriteDatabaseId, appwriteEvidenceCollectionId, ["orderDesc(\"created_at\")"]),
      listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, []),
    ]);

    const users = ((usersResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
      const clerkId = String(document.clerk_id ?? document.clerkUserId ?? document.$id ?? "");
      if (clerkId) {
        accumulator[clerkId] = document;
      }
      return accumulator;
    }, {});

    const evidenceByIssue = ((evidenceResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Array<Record<string, unknown>>>>((accumulator, document) => {
      const issueId = String(document.issue_id ?? document.issueId ?? "");
      if (!issueId) {
        return accumulator;
      }

      accumulator[issueId] = accumulator[issueId] ?? [];
      accumulator[issueId].push(document);
      return accumulator;
    }, {});

    const issues = ((issuesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).map((document) => {
      const createdBy = String(document.created_by ?? document.createdBy ?? "");
      const creator = users[createdBy];
      const issueEvidence = evidenceByIssue[String(document.$id ?? "")] ?? [];

      return {
        $id: document.$id,
        title: document.title,
        slug: document.slug,
        description: document.description,
        category: document.category,
        state: document.state,
        district: document.district,
        status: document.status,
        supporter_count: Number(document.supporter_count ?? document.supportCount ?? 0),
        evidence_count: Number(document.evidence_count ?? document.evidenceCount ?? issueEvidence.length),
        created_by: createdBy,
        creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen Reporter"),
        creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
        language: document.language ?? "en",
        location: document.location ?? null,
        createdAt: document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString(),
        evidence: issueEvidence.map((item) => ({
          fileId: String(item.$id ?? ""),
          name: String(item.file_name ?? item.fileName ?? "Evidence"),
          size: Number(item.size_bytes ?? item.fileSize ?? 0),
          mimeType: String(item.type ?? "application/octet-stream"),
          publicUrl: String(item.file_url ?? item.publicUrl ?? ""),
          sanitized: Boolean(item.verified ?? false),
        })),
      };
    });

    return NextResponse.json({ ok: true, issues });
  } catch (error) {
    console.error("Failed to list issues from Appwrite:", error);
    return NextResponse.json({ ok: true, issues: [] });
  }
}
