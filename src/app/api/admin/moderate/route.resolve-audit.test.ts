import assert from "node:assert/strict";
import { test } from "node:test";

test("resolution audit keeps the real action when a reason is supplied", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_moderator" }),
      currentUser: async () => { throw new Error("linked role should not need a profile"); },
    },
  } as NodeModule;

  try {
    const writes: Array<{ collection: string; data: Record<string, unknown> }> = [];
    let alertFails = false;
    let issueReadFails = false;
    let issueStatus = "pending_review";
    globalThis.fetch = async (input, init) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0] ?? "";
      if (collection === "users") return Response.json({ role: "moderator", clerk_id: "synthetic_moderator" });
      if (collection === "issues" && !init?.method) {
        if (issueReadFails) return Response.json({ message: "Synthetic read outage" }, { status: 503 });
        return Response.json({ $id: "synthetic_issue", status: issueStatus, created_by: "synthetic_creator", slug: "marked-issue" });
      }
      if (collection === "notifications" && alertFails) {
        return Response.json({ message: "Synthetic alert outage" }, { status: 503 });
      }
      const body = JSON.parse(String(init?.body)) as { data: Record<string, unknown> };
      writes.push({ collection, data: body.data });
      if (collection === "issues") issueStatus = String(body.data.status);
      return Response.json({ $id: "synthetic_record" });
    };

    const { POST } = await import("./route");
    const response = await POST(new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "resolve", reason: "Synthetic review evidence confirmed." }),
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(writes.map((write) => write.collection), ["issues", "moderation_logs", "notifications"]);
    assert.equal(writes[0].data.status, "resolved");
    assert.equal(writes[1].data.action, "approve");
    assert.equal(writes[1].data.reason, "Action: resolve. Synthetic review evidence confirmed.");
    assert.equal(writes[2].data.user_id, "synthetic_creator");
    assert.equal(writes[2].data.link, "/issues/marked-issue");
    assert.equal((await response.json()).notificationSaved, true);

    alertFails = true;
    const retry = await POST(new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "reject", reason: "Synthetic review reason." }),
    }));
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).notificationSaved, false);

    const writeCount = writes.length;
    const repeated = await POST(new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "reject", reason: "Repeated click." }),
    }));
    assert.equal(repeated.status, 409);
    assert.match((await repeated.json()).error, /already has that status/);
    assert.equal(writes.length, writeCount, "repeat review must not write status, audit, or alert");

    issueReadFails = true;
    const failedRead = await POST(new Request("https://example.test/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId: "synthetic_issue", action: "approve" }),
    }));
    assert.equal(failedRead.status, 503);
    assert.equal(writes.length, writeCount, "an unknown current status must not start a review write");
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
