import assert from "node:assert/strict";
import { test } from "node:test";

test("campaign creation gives check-before-retry guidance when the save result is uncertain", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      clerkClient: async () => ({ users: { getUser: async () => ({
        firstName: "Test", lastName: "Citizen", username: "synthetic", imageUrl: "",
      }) } }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let writes = 0;
    globalThis.fetch = async (_input, init) => {
      assert.equal(init?.method, "POST");
      writes += 1;
      throw new Error("synthetic private storage detail");
    };
    const response = await POST(new Request("https://example.test/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Synthetic civic campaign",
        description: "This synthetic campaign checks a failed save without using citizen records or real locations.",
        goals: "Confirm safe guidance after an uncertain write result.",
        category: "infrastructure",
        state: "Test State",
        language: "en",
      }),
    }) as never);
    assert.equal(writes, 1);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error, /check your dashboard before trying again/i);
    assert.doesNotMatch(body.error, /private storage detail/i);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
