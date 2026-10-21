import assert from "node:assert/strict";
import { test } from "node:test";

test("petition list loads evidence beyond the first 100 scoped records", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const evidenceOffsets: number[] = [];

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      if (collection === "petitions") {
        return Response.json({ documents: [
          { $id: "petition-one", slug: "one", status: "open", title: "First petition" },
          { $id: "petition-two", slug: "two", status: "open", title: "Second petition" },
        ] });
      }
      if (collection === "evidence") {
        const ids = queries.find((query) => query.attribute === "issue_id")?.values;
        assert.deepEqual(ids, ["petition-one", "petition-two"]);
        const offset = queries.find((query) => query.method === "offset")?.values[0] ?? 0;
        evidenceOffsets.push(offset);
        return Response.json({ documents: offset === 0
          ? Array.from({ length: 100 }, (_, index) => ({ $id: `evidence-${index}`, issue_id: "petition-one", file_url: "https://example.test/evidence" }))
          : [{ $id: "evidence-100", issue_id: "petition-two", file_url: "https://example.test/second" }] });
      }
      return Response.json({ documents: [] });
    };

    const response = await GET(new Request("https://example.test/api/petitions"));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(evidenceOffsets, [0, 100]);
    assert.equal(body.evidenceUnavailable, false);
    assert.equal(body.petitions[0].evidence.length, 100);
    assert.equal(body.petitions[1].evidence.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
