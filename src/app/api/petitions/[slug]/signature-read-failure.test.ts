import assert from "node:assert/strict";
import { test } from "node:test";

test("public petition remains readable when signature lookup fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const originalWarn = console.warn;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: "synthetic_viewer" }) },
  } as NodeModule;

  try {
    const reads: string[] = [];
    console.warn = () => {};
    globalThis.fetch = async (input) => {
      const url = String(input);
      reads.push(url);
      if (url.includes("/collections/petitions/")) {
        return Response.json({ documents: [{
          $id: "synthetic_petition",
          slug: "synthetic-petition",
          title: "Synthetic petition",
          created_by: "synthetic_creator",
        }] });
      }
      if (url.includes("/collections/signatures/")) {
        return Response.json({ message: "Synthetic signature failure" }, { status: 503 });
      }
      return Response.json({ documents: [] });
    };

    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.test/api/petitions/synthetic-petition"), {
      params: Promise.resolve({ slug: "synthetic-petition" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.petition.title, "Synthetic petition");
    assert.equal(body.hasSigned, false);
    assert.equal(reads.filter((url) => url.includes("/collections/signatures/")).length, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
