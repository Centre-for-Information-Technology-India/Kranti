import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("bulk alert read separates account failure from uncertain update", async () => {
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
    const { PATCH } = await import("./route");
    console.error = () => {};
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return Response.json({ message: "synthetic storage failure" }, { status: 500 });
    };
    const request = () => new NextRequest("https://example.test/api/notifications", { method: "PATCH" });

    const accountFailure = await PATCH(request());
    assert.equal(accountFailure.status, 503);
    assert.deepEqual(await accountFailure.json(), { error: "Unable to load your account. Please try again." });
    assert.equal(fetchCalls, 0);

    authMode = "unsigned";
    const unsigned = await PATCH(request());
    assert.equal(unsigned.status, 401);
    assert.equal(fetchCalls, 0);

    authMode = "signed";
    const uncertain = await PATCH(request());
    assert.equal(uncertain.status, 503);
    assert.deepEqual(await uncertain.json(), {
      error: "Some alerts may have been marked as read. Refresh alerts before trying again.",
    });
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
