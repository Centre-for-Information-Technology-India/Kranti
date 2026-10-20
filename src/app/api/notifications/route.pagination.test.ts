import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("alert pages stay owner-scoped and stop at the supported offset", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  let signedInUser: string | null = "synthetic_owner";
  let totalAlerts = 52;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: signedInUser }) },
  } as NodeModule;

  try {
    const { GET } = await import("./route");
    const seenOffsets: number[] = [];
    globalThis.fetch = async (input) => {
      const queries = new URL(String(input)).searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      assert.ok(queries.some((query) => query.attribute === "user_id" && query.values[0] === "synthetic_owner"));
      const offset = queries.find((query) => query.method === "offset")?.values[0] ?? 0;
      const limit = queries.find((query) => query.method === "limit")?.values[0];
      seenOffsets.push(offset);
      const count = Math.max(0, Math.min(limit, totalAlerts - offset));
      return Response.json({ documents: Array.from({ length: count }, (_, index) => ({
        $id: `synthetic_${offset + index}`,
        user_id: "synthetic_owner",
        type: "system",
        title: "Synthetic alert",
        message: "Synthetic fixture only",
        read: false,
        created_at: "2026-10-14T00:00:00.000Z",
      })) });
    };

    const first = await GET(new NextRequest("https://example.test/api/notifications"));
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.equal(firstBody.notifications.length, 50);
    assert.equal(firstBody.hasMore, true);

    const second = await GET(new NextRequest("https://example.test/api/notifications?offset=50"));
    const secondBody = await second.json();
    assert.equal(second.status, 200);
    assert.equal(secondBody.notifications.length, 2);
    assert.equal(secondBody.hasMore, false);
    assert.deepEqual(seenOffsets, [0, 50]);

    totalAlerts = 101;
    const fullPage = await GET(new NextRequest("https://example.test/api/notifications?limit=100"));
    const fullPageBody = await fullPage.json();
    assert.equal(fullPageBody.notifications.length, 100);
    assert.equal(fullPageBody.hasMore, true);
    assert.deepEqual(seenOffsets, [0, 50, 0, 100]);

    const cappedPage = await GET(new NextRequest("https://example.test/api/notifications?offset=10000"));
    assert.equal((await cappedPage.json()).hasMore, false);
    assert.deepEqual(seenOffsets, [0, 50, 0, 100, 10000]);

    for (const offset of ["-1", "10001", "1e3", "01"]) {
      const response = await GET(new NextRequest(`https://example.test/api/notifications?offset=${offset}`));
      assert.equal(response.status, 400);
    }
    for (const limit of ["0", "-1", "1e3"]) {
      const response = await GET(new NextRequest(`https://example.test/api/notifications?limit=${limit}`));
      assert.equal(response.status, 400);
    }
    assert.deepEqual(seenOffsets, [0, 50, 0, 100, 10000]);

    signedInUser = null;
    const unsigned = await GET(new NextRequest("https://example.test/api/notifications"));
    assert.equal(unsigned.status, 401);
    assert.deepEqual(seenOffsets, [0, 50, 0, 100, 10000]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
