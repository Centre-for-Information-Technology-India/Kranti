import assert from "node:assert/strict";
import { test } from "node:test";

test("an uncertain incident save returns safe retry guidance", async () => {
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
    const response = await POST(new Request("https://example.test/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic incident report",
          description: "This synthetic incident report contains enough text to pass validation. It names no real person or place and never reaches production storage.",
          incidentType: "other",
          incidentDate: "2026-10-16",
          state: "Test State",
          district: "Test District",
          language: "en",
          evidenceLinks: [],
          evidenceRequired: true,
          consent: true,
        },
        evidence: [{ fileId: "synthetic-file", name: "synthetic.txt", size: 1, mimeType: "text/plain" }],
      }),
    }));

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

test("a saved incident reply contains only its link fields", async () => {
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
    globalThis.fetch = async () => Response.json({ $id: "synthetic_report", private_note: "do not return" });
    const response = await POST(new Request("https://example.test/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic incident report",
          description: "This synthetic incident report contains enough text to pass validation. It names no real person or place and never reaches production storage.",
          incidentType: "other",
          incidentDate: "2026-10-16",
          state: "Test State",
          district: "Test District",
          language: "en",
          evidenceLinks: [],
          evidenceRequired: true,
          consent: true,
        },
        evidence: [{ fileId: "synthetic-file", name: "synthetic.txt", size: 1, mimeType: "text/plain" }],
      }),
    }));

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["ok", "reportId", "reportSlug"]);
    assert.equal(body.ok, true);
    assert.match(body.reportSlug, /^synthetic-incident-report/);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
