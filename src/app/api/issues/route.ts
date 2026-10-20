import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  appwriteStorageBucketId,
  appwriteDatabaseId,
  appwriteEvidenceCollectionId,
  appwriteIssuesCollectionId,
  appwriteUsersCollectionId,
  AppwriteRequestError,
  createDocument,
  deleteFile,
  downloadFile,
  getFileViewUrl,
  listDocuments,
  Query,
  upsertDocument,
  uploadFileBuffer,
} from "@/lib/appwrite";
import { buildIssueSlug, issueEvidenceSchema, issueSubmissionSchema } from "@/lib/issue-form";
import { detectEvidenceType } from "@/lib/evidence";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";
import { getUserRole } from "@/lib/role-lookup";
import { publicIssueStatuses } from "@/lib/public-issue-status";

export const runtime = "nodejs";

function safeFileId(seed: string) {
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || `file${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    let userId: string | null;
    try {
      ({ userId } = await auth());
    } catch {
      return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let clerkUser;
    try {
      clerkUser = await currentUser();
    } catch {
      return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
    }

    if (!clerkUser) {
      return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
    }

    let body: {
      payload?: unknown;
      evidence?: Array<{
        fileId: string;
        name: string;
        size: number;
        mimeType: string;
        publicUrl?: string;
      }>;
    };

    try {
      body = (await readJsonWithLimit(request, 1024 * 1024)) as typeof body;
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ error: "Issue details are too large. Shorten the text and try again." }, { status: 413 });
      }
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = issueSubmissionSchema.safeParse(body?.payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the issue details and try again." }, { status: 400 });
    }
    const submission = parsed.data;
    const evidenceResult = issueEvidenceSchema.safeParse(body?.evidence);
    if (!evidenceResult.success) {
      return NextResponse.json({ error: "Invalid evidence metadata" }, { status: 400 });
    }
    const evidenceFiles = evidenceResult.data;

    const issueId = `issue${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    const issueSlug = buildIssueSlug(submission.title, issueId);
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

    await upsertDocument(appwriteDatabaseId, appwriteIssuesCollectionId, issueId, {
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
    });

    let evidenceSaveFailed = false;
    for (const evidenceItem of uploadedEvidence) {
      const evidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
      try {
        await createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, evidenceId, {
          issue_id: issueId,
          type: detectEvidenceType(evidenceItem.mimeType),
          file_url: evidenceItem.publicUrl,
          file_name: evidenceItem.name,
          size_bytes: evidenceItem.size,
          verified: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        evidenceSaveFailed = true;
        console.warn("Issue evidence record could not be saved");
      }
    }

    // Store evidence links
    const evidenceLinks = Array.isArray(submission.evidenceLinks) ? submission.evidenceLinks.filter(Boolean) : [];
    for (const link of evidenceLinks) {
      const linkEvidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
      try {
        await createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, linkEvidenceId, {
          issue_id: issueId,
          type: "other",
          file_url: link,
          source_url: link,
          file_name: new URL(link).hostname,
          size_bytes: 0,
          verified: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        evidenceSaveFailed = true;
        console.warn("Issue evidence link could not be saved");
      }
    }

    return NextResponse.json({
      ok: true,
      issueId,
      issueSlug,
      evidenceSaved: !evidenceSaveFailed,
    });
  } catch (error) {
    console.error("Failed to create issue:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your issue was saved. Check your dashboard before trying again." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const rawOffset = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^(0|[1-9]\d*)$/.test(rawOffset) || Number(rawOffset) > 10000) {
    return NextResponse.json({ ok: false, error: "Invalid issue offset" }, { status: 400 });
  }
  const offset = Number(rawOffset);
  let canViewCreatorId = false;
  try {
    const { userId } = await auth();
    if (userId) {
      const role = await getUserRole(userId, null);
      canViewCreatorId = role === "admin" || role === "moderator";
    }
  } catch {
    // Public list access does not depend on a private role lookup.
  }
  try {
    const issuesResponse = await listDocuments(appwriteDatabaseId, appwriteIssuesCollectionId, [
      // Filter before offset so issues awaiting review cannot appear in any public page.
      Query.equal("status", [...publicIssueStatuses]),
      Query.orderDesc("$createdAt"),
      Query.limit(26),
      Query.offset(offset),
    ]);
    const pageDocuments = (issuesResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [];
    const issueDocuments = pageDocuments.slice(0, 25);
    const issueIds = issueDocuments.map((document) => String(document.$id ?? "")).filter(Boolean);
    const creatorIds = [...new Set(issueDocuments
      .map((document) => String(document.created_by ?? document.createdBy ?? ""))
      .filter(Boolean))];
    const [evidenceResponse, userResults] = await Promise.all([
      issueIds.length > 0
        ? listDocuments(appwriteDatabaseId, appwriteEvidenceCollectionId, [Query.equal("issue_id", issueIds), Query.limit(100)])
            .catch((error) => {
              console.warn("Issue list evidence unavailable:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
              return null;
            })
        : Promise.resolve({ documents: [] }),
      creatorIds.length > 0
        ? Promise.all(["clerk_id", "$id"].map(async (field) => {
          try {
            return await listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [Query.equal(field, creatorIds), Query.limit(25)]);
          } catch (error) {
            console.warn("Issue creator names unavailable:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
            return { documents: [] };
          }
        }))
        : Promise.resolve([]),
    ]);

    const users = userResults.flatMap((result) => (result as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
      for (const id of [document.clerk_id, document.clerkUserId, document.$id]) {
        if (id) accumulator[String(id)] = document;
      }
      return accumulator;
    }, {});

    const evidenceByIssue = ((evidenceResponse as { documents?: Array<Record<string, unknown>> } | null)?.documents ?? []).reduce<Record<string, Array<Record<string, unknown>>>>((accumulator, document) => {
      const issueId = String(document.issue_id ?? document.issueId ?? "");
      if (!issueId) {
        return accumulator;
      }

      accumulator[issueId] = accumulator[issueId] ?? [];
      accumulator[issueId].push(document);
      return accumulator;
    }, {});

    const issues = issueDocuments.map((document) => {
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
        ...(canViewCreatorId ? { created_by: createdBy } : {}),
        creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen Reporter"),
        creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
        language: document.language ?? "en",
        location: document.location ?? null,
        createdAt: document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString(),
        evidence: issueEvidence.map((item) => ({
          fileId: String(item.$id ?? ""),
          name: "Evidence",
          size: Number(item.size_bytes ?? item.fileSize ?? 0),
          mimeType: String(item.type ?? "application/octet-stream"),
          publicUrl: String(item.file_url ?? item.publicUrl ?? ""),
          sanitized: Boolean(item.verified ?? false),
        })),
      };
    });

    return NextResponse.json({ ok: true, issues, hasMore: pageDocuments.length > 25 && offset + 25 <= 10000, evidenceUnavailable: evidenceResponse === null });
  } catch (error) {
    console.error("Failed to list issues from Appwrite:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ ok: false, error: "Issues are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
