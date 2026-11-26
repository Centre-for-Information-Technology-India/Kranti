import assert from "node:assert/strict";
import { test } from "node:test";

test("campaign creation rejects a profile from another Clerk account before storage", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      clerkClient: async () => ({ users: { getUser: async () => ({
        id: "synthetic_other",
        firstName: "Wrong",
        lastName: "Person",
        username: null,
        imageUrl: "https://example.test/wrong.png",
      }) } }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let storageCalls = 0;
    globalThis.fetch = async () => {
      storageCalls += 1;
      throw new Error("Appwrite must not be called");
    };
    const response = await POST(new Request("https://example.test/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Synthetic civic campaign",
        description: "This synthetic campaign tests account ownership without naming a citizen.",
        goals: "Check that a foreign profile cannot supply a campaign name.",
        category: "infrastructure",
        state: "Test State",
        language: "en",
      }),
    }) as never);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Unable to load your account. Please try again." });
    assert.equal(storageCalls, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
