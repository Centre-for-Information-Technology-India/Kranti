import assert from "node:assert/strict";
import { test } from "node:test";

test("support and count commit together across retries and conflicts", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: "synthetic-supporter" }), currentUser: async () => null },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    for (const scenario of ["normal", "lost-response", "no-commit", "concurrent-conflict"] as const) {
      let count = 0;
      let supportExists = false;
      let commitAttempts = 0;
      let stagedOperations: Array<Record<string, unknown>> = [];

      globalThis.fetch = async (url, init) => {
        const path = String(url);
        if (path.includes("/collections/issues/documents?") && !init?.method) {
          return Response.json({ documents: [{ $id: "synthetic-issue", status: "open", supporter_count: count }] });
        }
        if (path.includes("/collections/issues/documents/synthetic-issue") && !init?.method) {
          return Response.json({ status: "open", supporter_count: count });
        }
        if (path.includes("/collections/supports/documents/") && !init?.method) {
          if (path.endsWith("/synthetic-legacy")) return Response.json({}, { status: 404 });
          return supportExists
            ? Response.json({ issue_id: "synthetic-issue", user_id: "synthetic-supporter", kind: "support" })
            : Response.json({}, { status: 404 });
        }
        if (path.endsWith("/databases/transactions") && init?.method === "POST") {
          return Response.json({ $id: `synthetic-transaction-${commitAttempts + 1}` }, { status: 201 });
        }
        if (path.includes("/databases/transactions/") && path.endsWith("/operations")) {
          stagedOperations = (JSON.parse(String(init?.body)) as { operations: Array<Record<string, unknown>> }).operations;
          assert.deepEqual(stagedOperations.map((operation) => operation.action), ["create", "increment"]);
          assert.equal((stagedOperations[1].data as { attribute: string }).attribute, "supporter_count");
          return Response.json({ operations: 2 }, { status: 201 });
        }
        if (path.includes("/databases/transactions/") && init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as { commit?: boolean };
          if (!body.commit) return Response.json({ status: "rolled_back" });
          commitAttempts += 1;
          if (scenario === "concurrent-conflict" && commitAttempts === 1) {
            count += 1; // A different supporter committed first.
            return Response.json({ type: "transaction_conflict" }, { status: 409 });
          }
          if (scenario === "no-commit") return Response.json({ type: "unavailable" }, { status: 503 });
          if (supportExists) return Response.json({ type: "duplicate" }, { status: 409 });
          supportExists = true;
          count += 1;
          if (scenario === "lost-response") return Response.json({ type: "unavailable" }, { status: 503 });
          return Response.json({ status: "committed" });
        }
        throw new Error(`Unexpected synthetic request: ${path}`);
      };

      const request = () => POST(new Request("https://example.test/api/issues/synthetic/support", { method: "POST" }), {
        params: Promise.resolve({ slug: "synthetic" }),
      });
      const response = await request();
      assert.equal(response.status, scenario === "no-commit" ? 503 : 200, scenario);
      assert.equal(supportExists, scenario !== "no-commit", scenario);
      assert.equal(count, scenario === "concurrent-conflict" ? 2 : scenario === "no-commit" ? 0 : 1, scenario);
      if (scenario !== "no-commit") {
        const repeat = await request();
        assert.equal(repeat.status, 200, `${scenario} repeat`);
        assert.equal((await repeat.json()).alreadySupported, true, scenario);
        assert.equal(count, scenario === "concurrent-conflict" ? 2 : 1, `${scenario} repeat count`);
      }
    }
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
