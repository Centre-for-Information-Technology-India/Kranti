import assert from "node:assert/strict";
import { test } from "node:test";

test("a rejected issue cannot receive support through its saved link", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: "synthetic-supporter" }), currentUser: async () => null },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let requests = 0;
    globalThis.fetch = async (_url, init) => {
      requests += 1;
      assert.equal(init?.method, undefined, "Rejected issues must never be written");
      return Response.json({ documents: [{ $id: "synthetic-issue", status: "rejected", created_by: "synthetic-owner" }] });
    };

    const response = await POST(new Request("https://example.test/api/issues/synthetic/support", { method: "POST" }), {
      params: Promise.resolve({ slug: "synthetic" }),
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Issue not found" });
    assert.equal(requests, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
