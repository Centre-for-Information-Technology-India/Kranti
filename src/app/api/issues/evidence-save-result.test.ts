import assert from "node:assert/strict";
import { test } from "node:test";

test("issue save reports failed evidence while preserving the saved issue", async () => {
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
    const caseCounts: number[] = [];
    console.warn = () => {};
    globalThis.fetch = async (input, init) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      writes.push(collection);
      if (collection === "issues") caseCounts.push(JSON.parse(String(init?.body)).data.evidence_count);
      if (collection === "evidence") return Response.json({ message: "Synthetic failure" }, { status: 503 });
      return Response.json({ $id: "synthetic-issue" });
    };

    const requestBody = JSON.stringify({
      payload: {
        title: "Synthetic streetlight issue",
        description: "A synthetic civic issue description with enough detail for validation and no real citizen information or place.",
        category: "infrastructure",
        state: "Delhi",
        district: "Synthetic district",
        landmark: "Synthetic landmark",
        evidenceLevel: "low",
        evidenceLinks: ["https://example.test/source"],
        language: "en",
        consent: true,
      },
      evidence: [],
    });
    const save = () => POST(new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    }));

    const response = await save();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.evidenceSaved, false);
    assert.match(body.issueSlug, /synthetic-streetlight-issue-/);
    assert.deepEqual(writes, ["issues", "evidence"]);
    assert.deepEqual(caseCounts, [1]);

    globalThis.fetch = async (input, init) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      writes.push(collection);
      if (collection === "issues") caseCounts.push(JSON.parse(String(init?.body)).data.evidence_count);
      return Response.json({ $id: "synthetic-issue" });
    };
    const savedResponse = await save();
    assert.equal(savedResponse.status, 200);
    assert.equal((await savedResponse.json()).evidenceSaved, true);
    assert.deepEqual(writes, ["issues", "evidence", "issues", "evidence"]);
    assert.deepEqual(caseCounts, [1, 1]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
