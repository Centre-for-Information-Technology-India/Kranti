import assert from "node:assert/strict";
import { test } from "node:test";

test("a petition ID conflict never overwrites an existing petition", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic-owner" }),
      currentUser: async () => ({ id: "synthetic-owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    const methods: string[] = [];
    globalThis.fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return Response.json({ message: "Document already exists" }, { status: 409 });
    };

    const response = await POST(new Request("https://example.test/api/petitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic civic petition",
          description: "A synthetic description for a civic issue that is long enough for validation.",
          demand: "Please address this synthetic issue.",
          targetAuthority: "Synthetic authority",
          category: "infrastructure",
          state: "Delhi",
          signatureGoal: 100,
          language: "en",
          evidenceLevel: "low",
          evidenceLinks: [],
          consent: true,
        },
        evidence: [],
      }),
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(methods, ["POST"]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
