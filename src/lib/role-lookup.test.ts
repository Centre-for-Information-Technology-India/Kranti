import assert from "node:assert/strict";
import { test } from "node:test";

import { AppwriteRequestError } from "./appwrite";
import { getUserRole } from "./role-lookup";

test("a storage failure cannot become a citizen role", async () => {
  let listCalls = 0;
  await assert.rejects(
    getUserRole("clerk-test", null, {
      getDocument: async () => { throw new AppwriteRequestError("Service unavailable", 503); },
      listDocuments: async () => { listCalls += 1; return { documents: [] }; },
    }),
    (error: unknown) => error instanceof AppwriteRequestError && error.status === 503,
  );
  assert.equal(listCalls, 0);
});

test("a missing direct document can find an existing linked moderator", async () => {
  const role = await getUserRole("clerk-test", null, {
    getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
    listDocuments: async () => ({ documents: [{ role: "moderator" }] }),
  });
  assert.equal(role, "moderator");
});

test("a failed linked lookup cannot become a citizen role", async () => {
  await assert.rejects(
    getUserRole("clerk-test", "test@example.invalid", {
      getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
      listDocuments: async () => { throw new AppwriteRequestError("Service unavailable", 503); },
    }),
    (error: unknown) => error instanceof AppwriteRequestError && error.status === 503,
  );
});

test("no matching role still resolves to citizen", async () => {
  const role = await getUserRole("clerk-test", null, {
    getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
    listDocuments: async () => ({ documents: [] }),
  });
  assert.equal(role, "citizen");
});
