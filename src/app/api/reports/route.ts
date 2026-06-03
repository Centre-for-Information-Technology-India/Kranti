import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  appwriteStorageBucketId,
  appwriteDatabaseId,
  appwriteEvidenceCollectionId,
  appwriteReportsCollectionId,
  createDocument,
  deleteFile,
  downloadFile,
  getFileViewUrl,
  upsertDocument,
  uploadFileBuffer,
} from "@/lib/appwrite";
import { buildReportSlug, reportSubmissionSchema } from "@/lib/report-form";
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

  const submission = reportSubmissionSchema.parse(body.payload);
  const evidenceFiles = Array.isArray(body.evidence) ? body.evidence : [];

  if (evidenceFiles.length === 0) {
    return NextResponse.json({ error: "Evidence is mandatory for incident reports" }, { status: 400 });
  }

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

  const reportDocument = await upsertDocument(appwriteDatabaseId, appwriteReportsCollectionId, reportId, {
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
    evidence_count: uploadedEvidence.length,
    created_at: new Date().toISOString(),
  });

  for (const evidenceItem of uploadedEvidence) {
    const evidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    void createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, evidenceId, {
      issue_id: reportId,
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
      issue_id: reportId,
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
    reportId,
    reportSlug,
    reportDocument,
    uploadedEvidence,
  });
}
