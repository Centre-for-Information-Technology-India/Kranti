import assert from "node:assert/strict";
import { test } from "node:test";

test("account sync gives retry guidance when Clerk authentication fails before writes", async () => {
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
    const { POST } = await import("./route");
    globalThis.fetch = async () => {
      appwriteRequests += 1;
      throw new Error("Appwrite should not be called");
    };

    const failed = await POST();
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { error: "Unable to sync your account. Please try again." });
    assert.equal(appwriteRequests, 0);

    authFails = false;
    const unsigned = await POST();
    assert.equal(unsigned.status, 401);
    assert.deepEqual(await unsigned.json(), { error: "Unauthorized" });
    assert.equal(appwriteRequests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
