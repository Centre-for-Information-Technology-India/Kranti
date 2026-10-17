import assert from "node:assert/strict";
import { test } from "node:test";

test("public campaign list and detail omit stored creator IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { GET: listCampaigns } = await import("./route");
    const { GET: getCampaign } = await import("./[slug]/route");
    globalThis.fetch = async () => Response.json({
      documents: [{
        $id: "synthetic-campaign",
        slug: "synthetic",
        title: "Synthetic campaign",
        status: "active",
        created_by: "private-clerk-id",
        creator_name: "Citizen",
        private_note: "private",
      }],
    });

    const listResponse = await listCampaigns(new Request("https://example.test/api/campaigns") as never);
    const detailResponse = await getCampaign(new Request("https://example.test/api/campaigns/synthetic") as never, {
      params: Promise.resolve({ slug: "synthetic" }),
    });
    assert.equal(listResponse.status, 200);
    assert.equal(detailResponse.status, 200);

    const listBody = await listResponse.json();
    const detailBody = await detailResponse.json();
    for (const campaign of [listBody.campaigns[0], detailBody.campaign]) {
      assert.equal(campaign.$id, "synthetic-campaign");
      assert.equal(campaign.creatorName, "Citizen");
      assert.equal("created_by" in campaign, false);
      assert.equal("private_note" in campaign, false);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
