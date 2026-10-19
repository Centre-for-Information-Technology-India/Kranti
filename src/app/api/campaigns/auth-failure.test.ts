import assert from "node:assert/strict";
import { test } from "node:test";

test("campaign creation gives account retry guidance when Clerk authentication fails", async () => {
  const originalFetch = globalThis.fetch;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  require.cache[clerkPath] = {
    exports: {
      auth: async () => { throw new Error("synthetic private Clerk detail"); },
      clerkClient: async () => { throw new Error("Clerk profile must not be called"); },
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      throw new Error("Appwrite must not be called");
    };
    const response = await POST(new Request("https://example.test/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }) as never);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error, /load your account.*try again/i);
    assert.doesNotMatch(body.error, /private Clerk detail/i);
    assert.equal(requests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
