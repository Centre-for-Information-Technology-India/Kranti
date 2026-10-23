import assert from "node:assert/strict";
import test from "node:test";

import { dashboardCasesForUser } from "./dashboard-cases";

test("dashboard pages owned cases without querying the absent created_at field", async () => {
  const owned = Array.from({ length: 101 }, (_, index) => ({
    $id: `own-${index}`,
    created_by: "test-user",
    $createdAt: String(index).padStart(3, "0"),
  }));
  const participation = [{ issue_id: "joined-1" }, { issue_id: "joined-1" }, { issue_id: "own-0" }];
  const calls: Array<{ collection: string; queries: Array<{ method: string; attribute?: string; values: unknown[] }> }> = [];
  const list = async (_database: string, collection: string, rawQueries: string[]) => {
    const queries = rawQueries.map((query) => JSON.parse(query));
    calls.push({ collection, queries });
    const offset = Number(queries.find((query) => query.method === "offset")?.values[0] ?? 0);
    if (collection === "supports") return { documents: offset === 0 ? participation : [] };
    const ids = queries.find((query) => query.attribute === "$id")?.values;
    if (ids) return { documents: [{ $id: "joined-1", created_by: "other-user", $createdAt: "200" }] };
    assert.deepEqual(queries.find((query) => query.attribute === "created_by")?.values, ["test-user"]);
    assert.equal(queries.some((query) => query.method === "orderDesc"), false);
    return { documents: owned.slice(offset, offset + 100) };
  };

  const cases = await dashboardCasesForUser("issues", "supports", "issue_id", "test-user", list);
  assert.equal(cases.length, 102);
  assert.equal(cases[0].$id, "joined-1");
  assert.equal(cases.at(-1)?.$id, "own-0");
  assert.equal(calls.filter((call) => call.collection === "issues").length, 3);
  assert.deepEqual(calls.find((call) => call.queries.some((query) => query.attribute === "$id"))?.queries.find((query) => query.attribute === "$id")?.values, ["joined-1"]);
});

test("dashboard identifies a failing read without logging account or case IDs", async () => {
  const originalError = console.error;
  const messages: string[] = [];
  console.error = (message: string) => { messages.push(message); };
  try {
    const list = async (_database: string, collection: string, queries: string[]) => {
      if (collection === "supports") {
        const offset = queries.map((query) => JSON.parse(query)).find((query) => query.method === "offset")?.values[0];
        if (offset === 0) throw new Error("Synthetic storage failure with private detail");
      }
      return { documents: [] };
    };
    await assert.rejects(dashboardCasesForUser("issues", "supports", "issue_id", "private-user", list, "issue"));
    assert.deepEqual(messages, ["Dashboard issue participation read failed at offset 0"]);
  } finally {
    console.error = originalError;
  }
});
