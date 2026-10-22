import assert from "node:assert/strict";
import { test } from "node:test";

test("petition alert never uses another Clerk account's profile name", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic-signer" }),
      currentUser: async () => ({ id: "synthetic-other-account", firstName: "Wrong", lastName: "Person" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let alertMessage = "";
    globalThis.fetch = async (url, init) => {
      const path = String(url);
      if (path.includes("/collections/petitions/documents?") && init?.method === undefined) {
        return Response.json({ documents: [{ $id: "synthetic-petition", status: "open", created_by: "synthetic-creator", title: "Synthetic petition" }] });
      }
      if (path.includes("/collections/signatures/documents?") && init?.method === undefined) {
        return Response.json({ documents: [] });
      }
      if (path.includes("/collections/signatures/documents") && init?.method === "POST") {
        return Response.json({ $id: "synthetic-signature" });
      }
      if (path.includes("/collections/petitions/documents/synthetic-petition/signature_count/increment")) {
        return Response.json({ signature_count: 1 });
      }
      if (path.includes("/collections/notifications/documents") && init?.method === "POST") {
        alertMessage = String((JSON.parse(String(init.body)) as { data: { message: string } }).data.message);
        return Response.json({ $id: "synthetic-alert" });
      }
      throw new Error(`Unexpected synthetic request: ${path}`);
    };

    const response = await POST(new Request("https://example.test/api/petitions/synthetic/sign", { method: "POST" }), {
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
