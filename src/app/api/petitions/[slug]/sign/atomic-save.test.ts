import assert from "node:assert/strict";
import { test } from "node:test";

test("signature and count commit together across failures and retries", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId: "synthetic-signer" }), currentUser: async () => null },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    for (const scenario of ["normal", "lost-response", "no-commit", "concurrent-conflict"] as const) {
      let count = 0;
      let signatureExists = false;
      let commitAttempts = 0;

      globalThis.fetch = async (url, init) => {
        const path = String(url);
        if (path.includes("/collections/petitions/documents?") && !init?.method) {
          return Response.json({ documents: [{ $id: "synthetic-petition", status: "open", signature_count: count }] });
        }
        if (path.includes("/collections/petitions/documents/synthetic-petition") && !init?.method) {
          return Response.json({ status: "open", signature_count: count });
        }
        if (path.includes("/collections/signatures/documents?") && !init?.method) {
          return Response.json({ documents: signatureExists ? [{ petition_id: "synthetic-petition", user_id: "synthetic-signer" }] : [] });
        }
        if (path.includes("/collections/signatures/documents/") && !init?.method) {
          return signatureExists
            ? Response.json({ petition_id: "synthetic-petition", user_id: "synthetic-signer" })
            : Response.json({}, { status: 404 });
        }
        if (path.endsWith("/databases/transactions") && init?.method === "POST") {
          return Response.json({ $id: `synthetic-transaction-${commitAttempts + 1}` }, { status: 201 });
        }
        if (path.includes("/databases/transactions/") && path.endsWith("/operations")) {
          const operations = (JSON.parse(String(init?.body)) as { operations: Array<Record<string, unknown>> }).operations;
          assert.deepEqual(operations.map((operation) => operation.action), ["create", "increment"]);
          assert.equal((operations[1].data as { attribute: string }).attribute, "signature_count");
          return Response.json({ operations: 2 }, { status: 201 });
        }
        if (path.includes("/databases/transactions/") && init?.method === "PATCH") {
          const body = JSON.parse(String(init.body)) as { commit?: boolean };
          if (!body.commit) return Response.json({ status: "rolled_back" });
          commitAttempts += 1;
          if (scenario === "concurrent-conflict" && commitAttempts === 1) {
            count += 1; // A different signer committed first.
            return Response.json({ type: "transaction_conflict" }, { status: 409 });
          }
          if (scenario === "no-commit") return Response.json({ type: "unavailable" }, { status: 503 });
          if (signatureExists) return Response.json({ type: "duplicate" }, { status: 409 });
          signatureExists = true;
          count += 1;
          if (scenario === "lost-response") return Response.json({ type: "unavailable" }, { status: 503 });
          return Response.json({ status: "committed" });
        }
        throw new Error(`Unexpected synthetic request: ${path}`);
      };

      const request = () => POST(new Request("https://example.test/api/petitions/synthetic/sign", { method: "POST" }), {
        params: Promise.resolve({ slug: "synthetic" }),
      });
      const response = await request();
      assert.equal(response.status, scenario === "no-commit" ? 503 : 200, scenario);
      assert.equal(signatureExists, scenario !== "no-commit", scenario);
      assert.equal(count, scenario === "concurrent-conflict" ? 2 : scenario === "no-commit" ? 0 : 1, scenario);
      if (scenario !== "no-commit") {
        const repeat = await request();
        assert.equal(repeat.status, 200, `${scenario} repeat`);
        assert.equal((await repeat.json()).alreadySigned, true, scenario);
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
