import assert from "node:assert/strict";
import { test } from "node:test";

test("moderation keeps linked roles and verified seeded roles available", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  let profileCalls = 0;
  let profileFails = false;
  let linked = false;
  let foreign = false;
  let verified = true;
  let reads = 0;

  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_moderator" }),
      currentUser: async () => {
        profileCalls += 1;
        if (profileFails) throw new Error("synthetic profile outage");
        return {
          primaryEmailAddressId: "primary",
          emailAddresses: [{
            id: "primary",
            emailAddress: "moderator@example.invalid",
            verification: { status: verified ? "verified" : "unverified" },
          }],
        };
      },
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    const request = () => new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "invalid" }),
    });

    globalThis.fetch = async () => {
      reads += 1;
      if (linked) return Response.json({ role: "moderator", clerk_id: "synthetic_moderator" });
      if (reads % 3 === 1) return Response.json({ message: "Not found" }, { status: 404 });
      if (reads % 3 === 2) return Response.json({ documents: [] });
      return Response.json({ documents: [{ role: "moderator", ...(foreign ? { clerk_id: "another_account" } : {}) }] });
    };

    linked = true;
    profileFails = true;
    assert.equal((await POST(request())).status, 400);
    assert.equal(profileCalls, 0);

    linked = false;
    profileFails = false;
    reads = 0;
    assert.equal((await POST(request())).status, 400);
    assert.equal(profileCalls, 1);

    foreign = true;
    reads = 0;
    assert.equal((await POST(request())).status, 403);

    foreign = false;
    verified = false;
    reads = 0;
    assert.equal((await POST(request())).status, 403);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
