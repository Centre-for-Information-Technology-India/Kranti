import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("alert reads separate Clerk failure, unsigned access, and storage failure", async () => {
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const originalKey = process.env.APPWRITE_API_KEY;
  let authMode: "failure" | "unsigned" | "signed" = "failure";
  let fetchCalls = 0;

  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => {
        if (authMode === "failure") throw new Error("synthetic Clerk failure");
        return { userId: authMode === "signed" ? "synthetic_owner" : null };
      },
    },
  } as NodeModule;

  try {
    const { GET } = await import("./route");
    console.error = () => {};
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return Response.json({ message: "synthetic storage failure" }, { status: 500 });
    };
    const request = () => new NextRequest("https://example.test/api/notifications");

    const accountFailure = await GET(request());
    assert.equal(accountFailure.status, 503);
    assert.deepEqual(await accountFailure.json(), { error: "Unable to load your account. Please try again." });
    assert.equal(fetchCalls, 0);

    authMode = "unsigned";
    const unsigned = await GET(request());
    assert.equal(unsigned.status, 401);
    assert.deepEqual(await unsigned.json(), { error: "Unauthorized" });
    assert.equal(fetchCalls, 0);

    authMode = "signed";
    const storageFailure = await GET(request());
    assert.equal(storageFailure.status, 503);
    assert.deepEqual(await storageFailure.json(), { error: "Alerts could not load. Please try again." });
    assert.equal(fetchCalls, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
