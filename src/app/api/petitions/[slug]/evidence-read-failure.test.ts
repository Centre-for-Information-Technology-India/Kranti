import assert from "node:assert/strict";
import { test } from "node:test";

test("public petition remains readable when its evidence lookup fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const originalWarn = console.warn;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;

  try {
    console.warn = () => {};
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "petitions") {
        return Response.json({ documents: [{
          $id: "synthetic-petition",
          slug: "synthetic",
          status: "open",
          title: "Synthetic petition",
          description: "Synthetic description",
          evidence_count: 1,
          created_by: "private-creator",
        }] });
      }
      if (collection === "evidence") return Response.json({ message: "Synthetic failure" }, { status: 503 });
      if (collection === "users") return Response.json({ documents: [] });
      throw new Error("Unexpected request");
    };

    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/petitions/synthetic"), {
      params: Promise.resolve({ slug: "synthetic" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.petition.title, "Synthetic petition");
    assert.equal(body.petition.evidence_count, 1);
    assert.deepEqual(body.petition.evidence, []);
    assert.equal(body.evidenceUnavailable, true);
    assert.equal("created_by" in body.petition, false);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
