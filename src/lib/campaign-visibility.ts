const publicCampaignStatuses = new Set(["active", "completed", "paused"]);
const indexableCampaignStatuses = new Set(["active", "completed"]);

export function isPublicCampaignStatus(status: unknown): boolean {
  return typeof status === "string" && publicCampaignStatuses.has(status);
}

export function isIndexableCampaignStatus(status: unknown): boolean {
  return typeof status === "string" && indexableCampaignStatuses.has(status);
}
