import assert from "node:assert/strict";
import { test } from "node:test";

test("issue list loads evidence beyond the first 100 scoped records", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  const evidenceOffsets: number[] = [];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      if (collection === "issues") {
        return Response.json({ documents: [
          { $id: "issue-one", slug: "one", status: "open", title: "First issue" },
          { $id: "issue-two", slug: "two", status: "open", title: "Second issue" },
        ] });
      }
      if (collection === "evidence") {
        const ids = queries.find((query) => query.attribute === "issue_id")?.values;
        assert.deepEqual(ids, ["issue-one", "issue-two"]);
        const offset = queries.find((query) => query.method === "offset")?.values[0] ?? 0;
        evidenceOffsets.push(offset);
        return Response.json({ documents: offset === 0
          ? Array.from({ length: 100 }, (_, index) => ({ $id: `evidence-${index}`, issue_id: "issue-one", file_url: "https://example.test/evidence" }))
          : [{ $id: "evidence-100", issue_id: "issue-two", file_url: "https://example.test/second" }] });
      }
      return Response.json({ documents: [] });
    };

    const response = await GET(new Request("https://example.test/api/issues"));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(evidenceOffsets, [0, 100]);
    assert.equal(body.evidenceUnavailable, false);
    assert.equal(body.issues[0].evidence.length, 100);
    assert.equal(body.issues[1].evidence.length, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
