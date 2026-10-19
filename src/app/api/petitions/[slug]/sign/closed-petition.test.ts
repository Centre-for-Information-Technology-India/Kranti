import assert from "node:assert/strict";
import { test } from "node:test";
import { canSignPetition } from "@/lib/petition-signing-status";

test("only active petitions accept signatures", () => {
  assert.equal(canSignPetition("open"), true);
  assert.equal(canSignPetition("in_progress"), true);
  for (const status of ["pending_review", "successful", "resolved", null]) {
    assert.equal(canSignPetition(status), false);
  }
});

test("closed petition returns conflict before signature reads or writes", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: "synthetic_signer" }) },
  } as NodeModule;

  try {
    const requests: Array<{ url: string; method: string }> = [];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      requests.push({ url, method: init?.method ?? "GET" });
      if (url.includes("/collections/petitions/")) {
        return Response.json({ documents: [{ $id: "synthetic_petition", status: "successful" }] });
      }
      throw new Error("Unexpected signature request");
    };

    const { POST } = await import("./route");
    const response = await POST(new Request("https://example.test/api/petitions/synthetic/sign", { method: "POST" }), {
      params: Promise.resolve({ slug: "synthetic" }),
    });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /not open for signatures/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "GET");
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
