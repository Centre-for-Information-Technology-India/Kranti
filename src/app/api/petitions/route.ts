import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  AppwriteRequestError,
  appwriteStorageBucketId,
  appwriteDatabaseId,
  appwriteEvidenceCollectionId,
  appwritePetitionsCollectionId,
  appwriteUsersCollectionId,
  createDocument,
  deleteFile,
  downloadFile,
  getFileViewUrl,
  listDocuments,
  Query,
  upsertDocument,
  uploadFileBuffer,
} from "@/lib/appwrite";
import { buildPetitionSlug, petitionEvidenceSchema, petitionSubmissionSchema } from "@/lib/petition-form";
import { detectEvidenceType } from "@/lib/evidence";
import { readJsonWithLimit, RequestBodyTooLargeError } from "@/lib/limited-json";

export const runtime = "nodejs";

function safeFileId(seed: string) {
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || `file${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    return await createPetition(request);
  } catch (error) {
    console.error("Petition creation failed:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "We couldn't confirm your petition was saved. Check your dashboard before trying again." },
      { status: 503 },
    );
  }
}

async function createPetition(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: "Unable to load Clerk user" }, { status: 400 });
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
      return NextResponse.json({ error: "Petition details are too large. Shorten the text and try again." }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = petitionSubmissionSchema.safeParse(body?.payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the petition details and try again." }, { status: 400 });
  }
  const submission = parsed.data;
  const evidenceResult = petitionEvidenceSchema.safeParse(body?.evidence);
  if (!evidenceResult.success) {
    return NextResponse.json({ error: "Invalid evidence metadata" }, { status: 400 });
  }
  const evidenceFiles = evidenceResult.data;

  const petitionId = `petition${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
  const petitionSlug = buildPetitionSlug(submission.title, petitionId);
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

  const petitionDocument = await upsertDocument(appwriteDatabaseId, appwritePetitionsCollectionId, petitionId, {
    created_by: clerkUser.id,
    title: submission.title,
    slug: petitionSlug,
    description: submission.description,
    demand: submission.demand,
    target_authority: submission.targetAuthority,
    category: submission.category,
    state: submission.state,
    district: submission.district || "",
    language: submission.language,
    status: "open",
    signature_count: 0,
    signature_goal: submission.signatureGoal,
    evidence_count: uploadedEvidence.length,
    featured: false,
    created_at: new Date().toISOString(),
  });

  for (const evidenceItem of uploadedEvidence) {
    const evidenceId = `evidence${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 32);
    void createDocument(appwriteDatabaseId, appwriteEvidenceCollectionId, evidenceId, {
      issue_id: petitionId,
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
      issue_id: petitionId,
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
    petitionId,
    petitionSlug,
    petitionDocument,
    uploadedEvidence,
  });
}

export async function GET(request: Request) {
  const rawOffset = new URL(request.url).searchParams.get("offset") ?? "0";
  if (!/^(0|[1-9]\d*)$/.test(rawOffset) || Number(rawOffset) > 10000) {
    return NextResponse.json({ ok: false, error: "Invalid petition offset" }, { status: 400 });
  }
  const offset = Number(rawOffset);
  try {
    const petitionsResponse = await listDocuments(appwriteDatabaseId, appwritePetitionsCollectionId, [
      Query.orderDesc("created_at"),
      Query.limit(26),
      Query.offset(offset),
    ]);
    const pageDocuments = (petitionsResponse as { documents?: Array<Record<string, unknown>> }).documents ?? [];
    const petitionDocuments = pageDocuments.slice(0, 25);
    const petitionIds = petitionDocuments.map((document) => String(document.$id ?? "")).filter(Boolean);
    const evidenceResponse = petitionIds.length > 0
      ? await listDocuments(appwriteDatabaseId, appwriteEvidenceCollectionId, [
        Query.equal("issue_id", petitionIds),
        Query.limit(100),
      ])
      : { documents: [] };
    const creatorIds = [...new Set(petitionDocuments
      .map((document) => String(document.created_by ?? document.createdBy ?? ""))
      .filter(Boolean))];
    const userResults = await Promise.all(Array.from({ length: Math.ceil(creatorIds.length / 50) }, (_, index) => {
      const ids = creatorIds.slice(index * 50, (index + 1) * 50);
      return Promise.all(["clerk_id", "$id"].map((field) =>
        listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [Query.equal(field, ids), Query.limit(50)])
      ));
    }));
    const users = userResults.flatMap((batch) => batch.flatMap((result) => (result as { documents?: Array<Record<string, unknown>> }).documents ?? [])).reduce<Record<string, Record<string, unknown>>>((accumulator, document) => {
      for (const id of [document.clerk_id, document.clerkUserId, document.$id]) {
        if (id) accumulator[String(id)] = document;
      }
      return accumulator;
    }, {});

    const evidenceByPetition = ((evidenceResponse as { documents?: Array<Record<string, unknown>> }).documents ?? []).reduce<Record<string, Array<Record<string, unknown>>>>((accumulator, document) => {
      const petitionId = String(document.issue_id ?? document.issueId ?? "");
      if (!petitionId) {
        return accumulator;
      }

      accumulator[petitionId] = accumulator[petitionId] ?? [];
      accumulator[petitionId].push(document);
      return accumulator;
    }, {});

    const petitions = petitionDocuments.map((document) => {
      const createdBy = String(document.created_by ?? document.createdBy ?? "");
      const creator = users[createdBy];
      const petitionEvidence = evidenceByPetition[String(document.$id ?? "")] ?? [];

      return {
        $id: document.$id,
        title: document.title,
        slug: document.slug,
        description: document.description,
        demand: document.demand,
        targetAuthority: document.target_authority ?? document.targetAuthority,
        category: document.category,
        state: document.state,
        district: document.district,
        status: document.status,
        signature_count: Number(document.signature_count ?? document.signatureCount ?? 0),
        signature_goal: Number(document.signature_goal ?? document.signatureGoal ?? 1000),
        evidence_count: Number(document.evidence_count ?? document.evidenceCount ?? petitionEvidence.length),
        created_by: createdBy,
        creatorName: String(creator?.display_name ?? creator?.full_name ?? creator?.username ?? "Citizen"),
        creatorAvatar: String(creator?.avatar_url ?? creator?.imageUrl ?? ""),
        language: document.language ?? "en",
        featured: Boolean(document.featured ?? false),
        createdAt: document.created_at ?? document.createdAt ?? document.$createdAt ?? new Date().toISOString(),
        evidence: petitionEvidence.map((item) => ({
          fileId: String(item.$id ?? ""),
          name: String(item.file_name ?? item.fileName ?? "Evidence"),
          size: Number(item.size_bytes ?? item.fileSize ?? 0),
          mimeType: String(item.type ?? "application/octet-stream"),
          publicUrl: String(item.file_url ?? item.publicUrl ?? ""),
          sanitized: Boolean(item.verified ?? false),
        })),
      };
    });

    return NextResponse.json({ ok: true, petitions, hasMore: pageDocuments.length > 25 && offset + 25 <= 10000 });
  } catch (error) {
    console.error("Failed to list petitions from Appwrite:", error);
    return NextResponse.json({ error: "Petitions are temporarily unavailable. Please try again." }, { status: 503 });
  }
}
