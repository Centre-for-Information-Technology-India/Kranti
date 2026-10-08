import assert from "node:assert/strict";
import { test } from "node:test";

test("Appwrite query preserves quoted input as one exact value", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { listDocuments, Query } = await import("./appwrite");
  const slug = 'road"], "other"]';

  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      assert.deepEqual(queries, [
        { method: "equal", attribute: "slug", values: [slug] },
        { method: "limit", values: [1] },
      ]);
      return Response.json({ documents: [] });
    };

    await listDocuments("test", "petitions", [Query.equal("slug", [slug]), Query.limit(1)]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
