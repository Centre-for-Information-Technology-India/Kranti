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
