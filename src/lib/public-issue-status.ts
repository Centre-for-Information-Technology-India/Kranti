export const publicIssueStatuses = ["open", "in_progress", "escalated", "resolved"] as const;

export function isPublicIssueStatus(status: unknown): boolean {
  return typeof status === "string" && publicIssueStatuses.some((value) => value === status);
}
