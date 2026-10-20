import { z } from "zod";

export function isEvidenceWebUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function publicEvidenceWebUrl(value: unknown): string {
  const url = String(value ?? "");
  return isEvidenceWebUrl(url) ? url : "";
}

export const evidenceWebUrlSchema = z.string().url("Must be a valid URL").refine(
  isEvidenceWebUrl,
  "Evidence links must use HTTP or HTTPS",
);

const allowedEvidenceTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "application/pdf"] as const;

export const evidenceFileSchema = z.instanceof(File).superRefine((file, ctx) => {
  if (file.size <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Evidence file cannot be empty." });
  }

  if (!allowedEvidenceTypes.includes(file.type as (typeof allowedEvidenceTypes)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Allowed file types are JPG, PNG, WEBP, AVIF, MP4, WEBM, and PDF.",
    });
  }

  const isImage = file.type.startsWith("image/");
  const maxSize = isImage ? 10 * 1024 * 1024 : 20 * 1024 * 1024;

  if (file.size > maxSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: isImage ? "Images must be 10MB or smaller." : "Videos and PDFs must be 20MB or smaller.",
    });
  }
});

export type EvidenceValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateEvidenceFile(file: File): EvidenceValidationResult {
  const parsed = evidenceFileSchema.safeParse(file);

  if (parsed.success) {
    return { ok: true };
  }

  return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid evidence file." };
}

export function getEvidenceType(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

export function detectEvidenceType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}
