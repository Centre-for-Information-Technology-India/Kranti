import assert from "node:assert/strict";
import { test } from "node:test";

test("petition creation gives account retry guidance when authentication throws before any write", async () => {
  const originalFetch = globalThis.fetch;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  require.cache[clerkPath] = {
    exports: {
      auth: async () => { throw new Error("Synthetic Clerk outage"); },
      currentUser: async () => { throw new Error("Profile lookup must not start"); },
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      return Response.json({ $id: "unexpected" });
    };

    const response = await POST(new Request("https://example.test/api/petitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: {}, evidence: [] }),
    }));

    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /unable to load your account/i);
    assert.equal(requests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
