import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("campaign pages remain bounded and reject invalid offsets", async () => {
  const originalFetch = globalThis.fetch;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { GET } = await import("./route");
  const seenOffsets: number[] = [];

  try {
    globalThis.fetch = async (input) => {
      const queries = new URL(String(input)).searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      if (queries.some((query) => query.method === "equal" && query.attribute === "status")) {
        assert.ok(queries.some((query) => query.method === "limit" && query.values[0] === 100));
        assert.ok(!queries.some((query) => query.method === "offset"));
        return Response.json({ documents: [] });
      }
      assert.ok(queries.some((query) => query.method === "notEqual" && query.attribute === "status"));
      assert.ok(queries.some((query) => query.method === "limit" && query.values[0] === 26));
      const offset = queries.find((query) => query.method === "offset")?.values[0];
      seenOffsets.push(offset);
      const remaining = 27 - offset;
      return Response.json({ documents: Array.from({ length: Math.max(0, Math.min(26, remaining)) }, (_, index) => ({
        $id: `synthetic-${offset + index}`,
        slug: `synthetic-${offset + index}`,
        status: "active",
      })) });
    };

    const first = await GET(new NextRequest("https://example.test/api/campaigns"));
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.equal(firstBody.campaigns.length, 25);
    assert.equal(firstBody.hasMore, true);

    const second = await GET(new NextRequest("https://example.test/api/campaigns?offset=25"));
    const secondBody = await second.json();
    assert.equal(second.status, 200);
    assert.equal(secondBody.campaigns.length, 2);
    assert.equal(secondBody.hasMore, false);
    assert.deepEqual(seenOffsets, [0, 25]);

    const filtered = await GET(new NextRequest("https://example.test/api/campaigns?status=pending_review&offset=25"));
    assert.equal(filtered.status, 400);
    const originalStatusPage = await GET(new NextRequest("https://example.test/api/campaigns?status=pending_review"));
    assert.equal(originalStatusPage.status, 200);
    assert.deepEqual(seenOffsets, [0, 25]);

    for (const offset of ["-1", "10001", "1e3", "01"]) {
      const response = await GET(new NextRequest(`https://example.test/api/campaigns?offset=${offset}`));
      assert.equal(response.status, 400);
    }
    assert.deepEqual(seenOffsets, [0, 25]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
