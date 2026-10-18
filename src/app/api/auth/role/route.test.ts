import assert from "node:assert/strict";
import { test } from "node:test";

test("role checks give retry guidance when Clerk authentication fails", async () => {
  const originalFetch = globalThis.fetch;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  let authFails = true;
  let appwriteRequests = 0;

  require.cache[clerkPath] = {
    exports: {
      auth: async () => {
        if (authFails) throw new Error("Synthetic Clerk outage");
        return { userId: null };
      },
      currentUser: async () => { throw new Error("Unexpected profile lookup"); },
    },
  } as NodeModule;

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async () => {
      appwriteRequests += 1;
      return Response.json({ role: "admin" });
    };

    const failed = await GET();
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { error: "Unable to check your role. Please try again." });
    assert.equal(appwriteRequests, 0);

    authFails = false;
    const unsigned = await GET();
    assert.equal(unsigned.status, 401);
    assert.deepEqual(await unsigned.json(), { error: "Unauthorized" });
    assert.equal(appwriteRequests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
