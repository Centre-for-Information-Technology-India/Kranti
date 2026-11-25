import assert from "node:assert/strict";
import { test } from "node:test";

test("transparency shows counts only when both public aggregates are valid", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const originalError = console.error;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  console.error = () => {};

  try {
    const { GET } = await import("./route");
    for (const [all, resolved, expected] of [
      [{ total: 4 }, { total: 1 }, { available: true, totalIssues: 4, resolvedIssues: 1 }],
      [{ documents: [] }, { total: 0 }, { available: false }],
      [{ total: 4 }, { total: 5 }, { available: false }],
      [{ total: -1 }, { total: 0 }, { available: false }],
    ] as const) {
      globalThis.fetch = async (input) => {
        const queries = new URL(String(input)).searchParams.getAll("queries[]").map((query) => JSON.parse(query));
        assert.ok(queries.some((query) => query.method === "limit" && query.values[0] === 1));
        const statuses = queries.find((query) => query.method === "equal" && query.attribute === "status")?.values;
        return Response.json(statuses?.length === 1 && statuses[0] === "resolved" ? resolved : all);
      };
      const response = await GET();
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), expected);
    }
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
