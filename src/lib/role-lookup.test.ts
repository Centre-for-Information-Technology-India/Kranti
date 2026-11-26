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

test("a direct record with a foreign Clerk ID cannot grant a role", async () => {
  const role = await getUserRole("user-current", null, {
    getDocument: async () => ({ role: "admin", clerk_id: "user-other" }),
    listDocuments: async () => ({ documents: [] }),
  });
  assert.equal(role, "citizen");
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

test("email fallback does not grant another account's moderator role", async () => {
  const role = await getUserRole("user-current", "shared@example.invalid", {
    getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
    listDocuments: async (_database, _collection, queries) => ({
      documents: queries?.some((query) => query.includes('"attribute":"email"'))
        ? [{ role: "moderator", clerk_id: "user-other" }]
        : [],
    }),
  });
  assert.equal(role, "citizen");
});

test("verified email fallback can read an unlinked seeded role", async () => {
  const role = await getUserRole("user-current", "shared@example.invalid", {
    getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
    listDocuments: async (_database, _collection, queries) => ({
      documents: queries?.some((query) => query.includes('"attribute":"email"'))
        ? [{ role: "moderator" }]
        : [],
    }),
  });
  assert.equal(role, "moderator");
});

test("a linked role does not require a Clerk profile lookup", async () => {
  let profileCalls = 0;
  const role = await getUserRole("user-current", null, {
    getDocument: async () => ({ role: "moderator", clerk_id: "user-current" }),
    listDocuments: async () => { throw new Error("Unneeded linked lookup"); },
  }, async () => {
    profileCalls += 1;
    throw new Error("Clerk profile unavailable");
  });
  assert.equal(role, "moderator");
  assert.equal(profileCalls, 0);
});

test("a missing ID role requests a verified email only for seeded fallback", async () => {
  let profileCalls = 0;
  const role = await getUserRole("user-current", null, {
    getDocument: async () => { throw new AppwriteRequestError("Not found", 404); },
    listDocuments: async (_database, _collection, queries) => ({
      documents: queries?.some((query) => query.includes('"attribute":"email"'))
        ? [{ role: "moderator" }]
        : [],
    }),
  }, async () => {
    profileCalls += 1;
    return "verified@example.invalid";
  });
  assert.equal(role, "moderator");
  assert.equal(profileCalls, 1);
});
