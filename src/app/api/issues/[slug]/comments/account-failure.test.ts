import assert from "node:assert/strict";
import { test } from "node:test";

test("comment creation gives account retry guidance before any write", async () => {
  const originalFetch = globalThis.fetch;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  require.cache[clerkPath] = {
    exports: {
      auth: async () => { throw new Error("Synthetic Clerk outage"); },
      currentUser: async () => null,
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let appwriteRequests = 0;
    globalThis.fetch = async () => {
      appwriteRequests += 1;
      return Response.json({ $id: "unexpected" });
    };
    const response = await POST(new Request("https://example.test/api/issues/synthetic/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Synthetic comment" }),
    }), { params: Promise.resolve({ slug: "synthetic" }) });

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Unable to load your account. Please try again." });
    assert.equal(appwriteRequests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
