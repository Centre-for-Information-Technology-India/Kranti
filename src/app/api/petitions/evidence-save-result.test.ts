import assert from "node:assert/strict";
import { test } from "node:test";

test("petition save reports failed evidence without hiding the saved petition", async () => {
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
      if (collection === "evidence") return Response.json({ message: "Synthetic evidence failure" }, { status: 503 });
      return Response.json({ $id: "synthetic-petition" });
    };

    const response = await POST(new Request("https://example.test/api/petitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic civic petition",
          description: "A synthetic description for a civic issue that is long enough for validation.",
          demand: "Please address this synthetic issue.",
          targetAuthority: "Synthetic authority",
          category: "infrastructure",
          state: "Delhi",
          signatureGoal: 100,
          language: "en",
          evidenceLevel: "low",
          evidenceLinks: ["https://example.test/source"],
          consent: true,
        },
        evidence: [],
      }),
    }));

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.evidenceSaved, false);
    assert.match(body.petitionSlug, /synthetic-civic-petition-/);
    assert.deepEqual(writes, ["petitions", "evidence"]);

    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      writes.push(collection);
      return Response.json({ $id: "synthetic-petition" });
    };
    const savedResponse = await POST(new Request("https://example.test/api/petitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic civic petition",
          description: "A synthetic description for a civic issue that is long enough for validation.",
          demand: "Please address this synthetic issue.",
          targetAuthority: "Synthetic authority",
          category: "infrastructure",
          state: "Delhi",
          signatureGoal: 100,
          language: "en",
          evidenceLevel: "low",
          evidenceLinks: ["https://example.test/source"],
          consent: true,
        },
        evidence: [],
      }),
    }));
    assert.equal(savedResponse.status, 200);
    assert.equal((await savedResponse.json()).evidenceSaved, true);
    assert.deepEqual(writes, ["petitions", "evidence", "petitions", "evidence"]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
