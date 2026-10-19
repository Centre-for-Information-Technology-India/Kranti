import assert from "node:assert/strict";
import { test } from "node:test";

test("moderation authentication failure returns retry guidance before data access", async () => {
  const originalFetch = globalThis.fetch;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  let mode: "failure" | "unsigned" = "failure";
  let dataRequests = 0;

  require.cache[clerkPath] = {
    exports: {
      auth: async () => {
        if (mode === "failure") throw new Error("synthetic Clerk failure");
        return { userId: null };
      },
      currentUser: async () => { throw new Error("profile must not load"); },
    },
  } as NodeModule;

  try {
    globalThis.fetch = async () => {
      dataRequests += 1;
      throw new Error("data must not be accessed");
    };
    const { POST } = await import("./route");
    const request = () => new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "approve" }),
    });

    const failed = await POST(request());
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { error: "Unable to load your account. Please try again." });
    assert.equal(dataRequests, 0);

    mode = "unsigned";
    const unsigned = await POST(request());
    assert.equal(unsigned.status, 401);
    assert.equal(dataRequests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
