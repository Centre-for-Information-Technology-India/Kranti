import assert from "node:assert/strict";
import { test } from "node:test";

test("Appwrite failures keep HTTP status so account sync can distinguish missing from failed", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { AppwriteRequestError, getDocument, listDocuments, updateDocument } = await import("./appwrite");

  try {
    for (const [status, request] of [
      [404, () => getDocument("test", "users", "synthetic_user")],
      [503, () => getDocument("test", "users", "synthetic_user")],
      [503, () => listDocuments("test", "users", [])],
      [503, () => updateDocument("test", "users", "synthetic_user", { clerk_id: "synthetic_user" })],
    ] as const) {
      globalThis.fetch = async () => Response.json({ message: "synthetic failure" }, { status });
      await assert.rejects(request(), (error: unknown) => {
        assert.ok(error instanceof AppwriteRequestError);
        assert.equal(error.status, status);
        return true;
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("Appwrite document IDs stay within one request path segment", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { getDocument, updateDocument, deleteDocument } = await import("./appwrite");
  const urls: string[] = [];

  try {
    globalThis.fetch = async (input) => {
      urls.push(String(input));
      return Response.json({ $id: "synthetic" });
    };

    const id = "test/record?other=true#part";
    await getDocument("test", "issues", id);
    await updateDocument("test", "issues", id, { status: "open" });
    await deleteDocument("test", "issues", id);

    assert.equal(urls.length, 3);
    for (const url of urls) {
      assert.match(url, /\/documents\/test%2Frecord%3Fother%3Dtrue%23part$/);
      assert.doesNotMatch(url, /\?other=true/);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
