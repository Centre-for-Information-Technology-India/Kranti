import assert from "node:assert/strict";
import { test } from "node:test";

test("notification reads send structured, user-scoped Appwrite queries", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { getUserNotifications } = await import("./notifications");
  const userId = 'synthetic_user_"quoted",value';
  let requests = 0;

  globalThis.fetch = async (input) => {
    requests += 1;
    const url = new URL(String(input));
    assert.ok(url.pathname.endsWith("/collections/notifications/documents"));
    assert.deepEqual(url.searchParams.getAll("queries[]").map((query) => JSON.parse(query)), [
      { method: "equal", attribute: "user_id", values: [userId] },
      { method: "orderDesc", attribute: "created_at" },
      { method: "limit", values: [requests === 1 ? 50 : 10] },
    ]);
    return Response.json({ documents: [{
      $id: "synthetic_notification",
      user_id: userId,
      type: "system",
      title: "Test alert",
      message: "Synthetic fixture only",
      read: false,
      created_at: "2026-09-28T00:00:00.000Z",
    }] });
  };

  try {
    const notifications = await getUserNotifications(userId);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].user_id, userId);
    assert.equal(notifications[0].title, "Test alert");
    assert.equal((await getUserNotifications(userId, 10)).length, 1);
    assert.equal(requests, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
