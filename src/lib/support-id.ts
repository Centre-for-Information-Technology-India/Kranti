import { createHash } from "node:crypto";

// Keep this only for finding support saved before IDs included the full user identity.
export function legacySupportDocumentId(issueId: string, userId: string) {
  return `support-${issueId}-${userId}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 36);
}

export function supportDocumentId(issueId: string, userId: string) {
  const digest = createHash("sha256").update(JSON.stringify([issueId, userId])).digest("hex");
  return `support-${digest.slice(0, 28)}`;
}

export function belongsToSupporter(document: Record<string, unknown>, issueId: string, userId: string) {
  return document.issue_id === issueId && document.user_id === userId && document.kind === "support";
}
