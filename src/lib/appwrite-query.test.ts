import assert from "node:assert/strict";
import { test } from "node:test";

test("upsert retries a create only for HTTP conflict", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { upsertDocument } = await import("./appwrite");
  const methods: string[] = [];

  try {
    globalThis.fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      if (init?.method === "POST") return Response.json({ message: "Duplicate document ID" }, { status: 409 });
      return Response.json({ $id: "marked-test", saved: true });
    };

    const result = await upsertDocument("test", "users", "marked-test", { consent_accepted: true });
    assert.deepEqual(result, { $id: "marked-test", saved: true });
    assert.deepEqual(methods, ["POST", "PATCH"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("upsert does not overwrite after a non-conflict error", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { upsertDocument, AppwriteRequestError } = await import("./appwrite");
  const methods: string[] = [];

  try {
    globalThis.fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return Response.json({ message: "Value already exists in another field" }, { status: 400 });
    };

    await assert.rejects(
      upsertDocument("test", "users", "marked-test", { consent_accepted: true }),
      (error: unknown) => error instanceof AppwriteRequestError && error.status === 400,
    );
    assert.deepEqual(methods, ["POST"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

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

test("dashboard user lookups keep a quoted Clerk ID exact", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { listDocuments, Query } = await import("./appwrite");
  const userId = 'user"], "other-user';
  const seenCollections: string[] = [];

  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.match(/\/collections\/([^/]+)\/documents$/)?.[1];
      assert.ok(collection);
      seenCollections.push(collection);
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      assert.deepEqual(queries, [{ method: "equal", attribute: "user_id", values: [userId] }]);
      return Response.json({ documents: [] });
    };

    await Promise.all([
      listDocuments("test", "supports", [Query.equal("user_id", [userId])]),
      listDocuments("test", "signatures", [Query.equal("user_id", [userId])]),
    ]);
    assert.deepEqual(seenCollections.sort(), ["signatures", "supports"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("comment lookups keep quoted slugs and issue IDs exact", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { listDocuments, Query } = await import("./appwrite");
  const slug = 'streetlight"], "other-issue';
  const issueId = 'issue"], "other-issue';
  const seen: unknown[][] = [];

  try {
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      seen.push(url.searchParams.getAll("queries[]").map((query) => JSON.parse(query)));
      return Response.json({ documents: [] });
    };

    await listDocuments("test", "issues", [Query.equal("slug", [slug]), Query.limit(1)]);
    await listDocuments("test", "comments", [
      Query.equal("issue_id", [issueId]),
      Query.equal("status", ["approved"]),
      Query.orderAsc("created_at"),
    ]);

    assert.deepEqual(seen, [
      [{ method: "equal", attribute: "slug", values: [slug] }, { method: "limit", values: [1] }],
      [
        { method: "equal", attribute: "issue_id", values: [issueId] },
        { method: "equal", attribute: "status", values: ["approved"] },
        { method: "orderAsc", attribute: "created_at" },
      ],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
