import assert from "node:assert/strict";
import { test } from "node:test";

test("support alert never uses another Clerk account's profile name", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic-supporter" }),
      currentUser: async () => ({ id: "synthetic-other-account", firstName: "Wrong", lastName: "Person" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let alertMessage = "";
    globalThis.fetch = async (url, init) => {
      const path = String(url);
      if (path.includes("/collections/issues/documents?") && init?.method === undefined) {
        return Response.json({ documents: [{ $id: "synthetic-issue", status: "open", created_by: "synthetic-creator", title: "Synthetic issue", supporter_count: 0 }] });
      }
      if (path.includes("/collections/supports/documents/") && init?.method === undefined) {
        return Response.json({ message: "Not found" }, { status: 404 });
      }
      if (path.endsWith("/databases/transactions") && init?.method === "POST") {
        return Response.json({ $id: "synthetic-transaction" }, { status: 201 });
      }
      if (path.includes("/databases/transactions/synthetic-transaction/operations")) {
        return Response.json({ operations: 2 }, { status: 201 });
      }
      if (path.endsWith("/databases/transactions/synthetic-transaction") && init?.method === "PATCH") {
        return Response.json({ status: "committed" });
      }
      if (path.includes("/collections/issues/documents/synthetic-issue") && init?.method === undefined) {
        return Response.json({ supporter_count: 1 });
      }
      if (path.includes("/collections/notifications/documents") && init?.method === "POST") {
        alertMessage = String((JSON.parse(String(init.body)) as { data: { message: string } }).data.message);
        return Response.json({ $id: "synthetic-alert" });
      }
      throw new Error(`Unexpected synthetic request: ${path}`);
    };

    const response = await POST(new Request("https://example.test/api/issues/synthetic/support", { method: "POST" }), {
      params: Promise.resolve({ slug: "synthetic" }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).notificationSaved, true);
    assert.match(alertMessage, /Someone/);
    assert.doesNotMatch(alertMessage, /Wrong Person/);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
