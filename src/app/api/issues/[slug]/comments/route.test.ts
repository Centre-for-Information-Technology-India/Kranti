import assert from "node:assert/strict";
import { test } from "node:test";

test("comment replies keep private fields out and survive a Clerk profile outage", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  const originalWarn = console.warn;
  let profileUnavailable = false;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => {
        if (profileUnavailable) throw new Error("synthetic profile outage");
        return { firstName: "Test", lastName: "Citizen" };
      },
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let saved: Record<string, unknown> = {};
    globalThis.fetch = async (_url, init) => init?.method === "POST"
      ? Response.json({
          $id: "synthetic_comment",
          issue_id: "synthetic_issue",
          user_id: "synthetic_owner",
          user_name: (saved = (JSON.parse(String(init.body)) as { data: Record<string, unknown> }).data).user_name,
          avatar_url: null,
          content: "Synthetic comment",
          status: "approved",
          created_at: "2026-10-16T00:00:00.000Z",
          private_note: "do not return",
        })
      : Response.json({ documents: [{ $id: "synthetic_issue" }] });

    const response = await POST(new Request("https://example.test/api/issues/test/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Synthetic comment" }),
    }), { params: Promise.resolve({ slug: "test" }) });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body.comment).sort(), ["$id", "avatar_url", "content", "createdAt", "issue_id", "status", "user_name"]);
    assert.equal(body.comment.$id, "synthetic_comment");
    assert.equal(body.comment.createdAt, "2026-10-16T00:00:00.000Z");
    assert.equal(body.comment.avatar_url, "");

    profileUnavailable = true;
    console.warn = () => {};
    const fallbackResponse = await POST(new Request("https://example.test/api/issues/test/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Another synthetic comment" }),
    }), { params: Promise.resolve({ slug: "test" }) });
    assert.equal(fallbackResponse.status, 200);
    assert.equal(saved.user_id, "synthetic_owner");
    assert.equal(saved.user_name, "Citizen");
    assert.equal(saved.avatar_url, null);
    assert.equal((await fallbackResponse.json()).comment.user_name, "Citizen");
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
