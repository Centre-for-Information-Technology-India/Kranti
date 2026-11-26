export function buildCampaignSlug(title: string, campaignId: string): string {
  const readable = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 78)
    .replace(/-$/g, "");

  return `${readable || "campaign"}-${campaignId}`;
}
