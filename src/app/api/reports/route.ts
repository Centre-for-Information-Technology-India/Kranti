import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  AppwriteRequestError,
  appwriteStorageBucketId,
  appwriteDatabaseId,
  appwriteEvidenceCollectionId,
  appwriteReportsCollectionId,
  createDocument,
  deleteFile,
  downloadFile,
  getFileViewUrl,
  uploadFileBuffer,
} from "@/lib/appwrite";
import { buildReportSlug, reportEvidenceSchema, reportSubmissionSchema } from "@/lib/report-form";
import { detectEvidenceType } from "@/lib/evidence";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";

export const runtime = "nodejs";

function safeFileId(seed: string) {
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || `file${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    return await createReport(request);
  } catch (error) {
    console.error("Incident report creation failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your report was saved. Keep your draft and contact Kranti before trying again." },
      { status: 503 },
    );
  }
}

async function createReport(request: Request) {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "Unable to load your account. Please try again." }, { status: 503 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let clerkUser: Awaited<ReturnType<typeof currentUser>>;
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
      return NextResponse.json({ error: "Report details are too large. Shorten the text and try again." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reportSubmissionSchema.safeParse(body?.payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the report details and try again." }, { status: 400 });
  }
  const submission = parsed.data;
  const evidenceResult = reportEvidenceSchema.safeParse(body?.evidence);
  if (!evidenceResult.success) {
    const error = Array.isArray(body?.evidence) && body.evidence.length === 0
      ? "Evidence is mandatory for incident reports"
      : "Invalid evidence metadata";
    return NextResponse.json({ error }, { status: 400 });
  }
  const evidenceFiles = evidenceResult.data;

  const reportId = `report${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
  const reportSlug = buildReportSlug(submission.title);
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

      await deleteFile(appwriteStorageBucketId, file.fileId).catch(() => {});

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

  const evidenceLinks = Array.isArray(submission.evidenceLinks) ? submission.evidenceLinks.filter(Boolean) : [];

  await createDocument(appwriteDatabaseId, appwriteReportsCollectionId, reportId, {
    created_by: clerkUser.id,
    title: submission.title,
    slug: reportSlug,
    description: submission.description,
    incident_type: submission.incidentType,
    incident_date: submission.incidentDate,
    state: submission.state,
    district: submission.district,
    landmark: submission.landmark || "",
    language: submission.language,
    status: "pending_review",
    visibility: "moderated",
    evidence_count: uploadedEvidence.length + evidenceLinks.length,
    created_at: new Date().toISOString(),
  });

  let evidenceSaveFailed = false;
  for (const evidenceItem of uploadedEvidence) {
    const evidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    try {
      await createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, evidenceId, {
        issue_id: reportId,
        type: detectEvidenceType(evidenceItem.mimeType),
        file_url: evidenceItem.publicUrl,
        file_name: evidenceItem.name,
        size_bytes: evidenceItem.size,
        verified: false,
        created_at: new Date().toISOString(),
      });
    } catch {
      evidenceSaveFailed = true;
      console.warn("Incident evidence record could not be saved");
    }
  }

  // Store evidence links
  for (const link of evidenceLinks) {
    const linkEvidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    try {
      await createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, linkEvidenceId, {
        issue_id: reportId,
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
      console.warn("Incident evidence link could not be saved");
    }
  }

  return NextResponse.json({
    ok: true,
    reportId,
    reportSlug,
    evidenceSaved: !evidenceSaveFailed,
  });
}
