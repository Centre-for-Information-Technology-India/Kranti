import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

process.env.APPWRITE_API_KEY = "synthetic-test-key";

test("public campaign routes hide submissions awaiting review", async () => {
  const originalFetch = globalThis.fetch;
  const calls: URL[] = [];
  globalThis.fetch = async (input) => {
    calls.push(new URL(String(input)));
    return Response.json({ documents: [{ $id: "synthetic-1", slug: "test-campaign", status: "pending_review", title: "Private draft" }] });
  };

  try {
    const { GET: list } = await import("../app/api/campaigns/route");
    const { GET: detail } = await import("../app/api/campaigns/[slug]/route");

    const bypass = await list(new NextRequest("http://localhost/api/campaigns?status=pending_review"));
    assert.deepEqual(await bypass.json(), { campaigns: [] });
    assert.equal(calls.length, 0);

    const listing = await list(new NextRequest("http://localhost/api/campaigns"));
    assert.deepEqual(await listing.json(), { campaigns: [], hasMore: false });
    assert.equal(calls.length, 1);

    const single = await detail(new NextRequest("http://localhost/api/campaigns/test-campaign"), {
      params: Promise.resolve({ slug: "test-campaign" }),
    });
    assert.equal(single.status, 404);
    assert.deepEqual(await single.json(), { error: "Campaign not found" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
