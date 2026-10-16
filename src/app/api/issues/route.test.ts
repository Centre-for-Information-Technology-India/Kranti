import assert from "node:assert/strict";
import { test } from "node:test";

test("an uncertain issue save tells citizens to check before retrying", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => ({ id: "synthetic_owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let writes = 0;
    globalThis.fetch = async () => {
      writes += 1;
      return Response.json({ message: "Synthetic Appwrite failure" }, { status: 503 });
    };
    const request = new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic broken streetlight",
          description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
          category: "infrastructure",
          state: "Test State",
          district: "Test District",
          landmark: "Test Landmark",
          evidenceLevel: "low",
          evidenceLinks: [],
          language: "en",
          consent: true,
        },
        evidence: [],
      }),
    });

    const response = await POST(request);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /check your dashboard before trying again/i);
    assert.equal(writes, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("a saved issue reply contains only its link fields", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => ({ id: "synthetic_owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    globalThis.fetch = async () => Response.json({ $id: "synthetic_issue", private_note: "do not return" });
    const request = new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic broken streetlight",
          description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
          category: "infrastructure",
          state: "Test State",
          district: "Test District",
          landmark: "Test Landmark",
          evidenceLevel: "low",
          evidenceLinks: [],
          language: "en",
          consent: true,
        },
        evidence: [],
      }),
    });

    const response = await POST(request);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["issueId", "issueSlug", "ok"]);
    assert.equal(body.ok, true);
    assert.match(body.issueSlug, /^synthetic-broken-streetlight-issue/);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
