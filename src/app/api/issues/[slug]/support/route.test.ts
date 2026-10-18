import assert from "node:assert/strict";
import { test } from "node:test";

test("issue support gives account retry guidance before any write", async () => {
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
    let writes = 0;
    globalThis.fetch = async () => {
      writes += 1;
      return Response.json({ $id: "unexpected" });
    };
    const response = await POST(new Request("https://example.test/api/issues/marked-absent/support", {
      method: "POST",
    }), { params: Promise.resolve({ slug: "marked-absent" }) });

    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /unable to load your account/i);
    assert.equal(writes, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
  }
});
