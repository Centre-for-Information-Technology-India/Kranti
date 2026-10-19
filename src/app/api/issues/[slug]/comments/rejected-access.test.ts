import assert from "node:assert/strict";
import { test } from "node:test";

test("public readers cannot fetch comments or write to unpublished issues", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  let userId: string | null = null;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: { auth: async () => ({ userId }), currentUser: async () => null },
  } as NodeModule;

  try {
    const { GET, POST } = await import("./route");
    for (const status of ["rejected", "pending_review"]) {
      let issueReads = 0;
      globalThis.fetch = async (url, init) => {
        if (init?.method === "POST") throw new Error("Comment was written");
        if (String(url).includes("/collections/issues/")) {
          issueReads += 1;
          return Response.json({ documents: [{ $id: "synthetic_issue", status, created_by: "owner" }] });
        }
        if (String(url).includes("/collections/users/")) return Response.json({ documents: [] });
        if (String(url).includes("/collections/comments/")) throw new Error("Unpublished comments were read");
        throw new Error("Unexpected request");
      };

      const response = await GET(new Request("https://example.test/api/issues/synthetic/comments"), {
        params: Promise.resolve({ slug: "synthetic" }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, comments: [], hasMore: false });
      assert.equal(issueReads, 1);

      userId = "stranger";
      issueReads = 0;
      const post = await POST(new Request("https://example.test/api/issues/synthetic/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Synthetic comment" }),
      }), { params: Promise.resolve({ slug: "synthetic" }) });
      assert.equal(post.status, 404);
      assert.equal(issueReads, 1);
    }
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
