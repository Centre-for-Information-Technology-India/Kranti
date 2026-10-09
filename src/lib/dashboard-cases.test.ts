import assert from "node:assert/strict";
import test from "node:test";

import { dashboardCasesForUser } from "./dashboard-cases";

test("dashboard includes cases after the first page without reading unrelated cases", async () => {
  const owned = Array.from({ length: 101 }, (_, index) => ({
    $id: `own-${index}`,
    created_by: "test-user",
    created_at: String(index).padStart(3, "0"),
  }));
  const participation = [{ issue_id: "joined-1" }, { issue_id: "joined-1" }, { issue_id: "own-0" }];
  const calls: Array<{ collection: string; queries: Array<{ method: string; attribute?: string; values: unknown[] }> }> = [];
  const list = async (_database: string, collection: string, rawQueries: string[]) => {
    const queries = rawQueries.map((query) => JSON.parse(query));
    calls.push({ collection, queries });
    const offset = Number(queries.find((query) => query.method === "offset")?.values[0] ?? 0);
    if (collection === "supports") return { documents: offset === 0 ? participation : [] };
    const ids = queries.find((query) => query.attribute === "$id")?.values;
    if (ids) return { documents: [{ $id: "joined-1", created_by: "other-user", created_at: "200" }] };
    assert.deepEqual(queries.find((query) => query.attribute === "created_by")?.values, ["test-user"]);
    return { documents: owned.slice(offset, offset + 100) };
  };

  const cases = await dashboardCasesForUser("issues", "supports", "issue_id", "test-user", list);
  assert.equal(cases.length, 102);
  assert.equal(cases[0].$id, "joined-1");
  assert.equal(cases.at(-1)?.$id, "own-0");
  assert.equal(calls.filter((call) => call.collection === "issues").length, 3);
  assert.deepEqual(calls.find((call) => call.queries.some((query) => query.attribute === "$id"))?.queries.find((query) => query.attribute === "$id")?.values, ["joined-1"]);
});
