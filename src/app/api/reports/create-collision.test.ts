import assert from "node:assert/strict";
import { test } from "node:test";

test("an incident ID conflict never overwrites an existing report", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic-owner" }),
      currentUser: async () => ({ id: "synthetic-owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    const methods: string[] = [];
    globalThis.fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return Response.json({ message: "Document already exists" }, { status: 409 });
    };

    const response = await POST(new Request("https://example.test/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic incident report",
          description: "This synthetic report has enough detail for validation. It names no real incident, person, or place, and it never reaches production storage.",
          incidentType: "other",
          incidentDate: "2026-10-21",
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
    assert.match((await response.json()).error, /keep your draft and contact Kranti before trying again/i);
    assert.deepEqual(methods, ["POST"]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
