import assert from "node:assert/strict";
import { test } from "node:test";

test("campaign creation gives safe retry guidance before writing when Clerk profile fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      clerkClient: async () => ({ users: { getUser: async () => { throw new Error("synthetic private Clerk detail"); } } }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let writes = 0;
    globalThis.fetch = async () => {
      writes += 1;
      throw new Error("Appwrite must not be called");
    };
    const response = await POST(new Request("https://example.test/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Synthetic civic campaign",
        description: "This synthetic campaign describes a test need without naming a citizen or real location.",
        goals: "Check that account failure causes no saved campaign.",
        category: "infrastructure",
        state: "Test State",
        language: "en",
      }),
    }) as never);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error, /try again/i);
    assert.doesNotMatch(body.error, /private Clerk detail/i);
    assert.equal(writes, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
