import assert from "node:assert/strict";
import { test } from "node:test";

test("incident save reports missing evidence without hiding the saved report", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const originalWarn = console.warn;
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
    const writes: string[] = [];
    console.warn = () => {};
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      writes.push(collection);
      if (collection === "evidence") return Response.json({ message: "Synthetic failure" }, { status: 503 });
      return Response.json({ $id: "synthetic-report" });
    };

    const requestBody = JSON.stringify({
      payload: {
        title: "Synthetic incident report",
        description: "This synthetic report contains enough detail for validation. It names no real citizen or location, and it never reaches production storage.",
        incidentType: "other",
        incidentDate: "2026-10-16",
        state: "Test State",
        district: "Test District",
        language: "en",
        evidenceLinks: ["https://example.test/source"],
        evidenceRequired: true,
        consent: true,
      },
      evidence: [{ fileId: "synthetic-file", name: "synthetic.txt", size: 1, mimeType: "text/plain" }],
    });
    const save = () => POST(new Request("https://example.test/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    }));

    const response = await save();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.evidenceSaved, false);
    assert.match(body.reportId, /^report/);
    assert.deepEqual(writes, ["reports", "evidence", "evidence"]);

    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      writes.push(collection);
      return Response.json({ $id: "synthetic-report" });
    };
    const savedResponse = await save();
    assert.equal(savedResponse.status, 200);
    assert.equal((await savedResponse.json()).evidenceSaved, true);
    assert.deepEqual(writes, ["reports", "evidence", "evidence", "reports", "evidence", "evidence"]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
