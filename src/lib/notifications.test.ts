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

test("notification read failures remain failures instead of empty alerts", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { getUserNotifications } = await import("./notifications");

  try {
    globalThis.fetch = async () => Response.json({ message: "synthetic service failure" }, { status: 503 });
    await assert.rejects(getUserNotifications("synthetic_user"), /synthetic service failure/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("notification mutations enforce ownership and surface storage failures", async () => {
  const originalFetch = globalThis.fetch;
  const { markNotificationAsRead, markAllNotificationsAsRead } = await import("./notifications");
  const own = { $id: "synthetic_notification", user_id: "owner", read: false };
  let documents = [own];
  let writes = 0;
  let failRead = false;
  let failWrite = false;
  globalThis.fetch = async (input, init) => {
    if (init?.method === "PATCH") {
      writes++;
      assert.ok(String(input).endsWith("/documents/synthetic_notification"));
      assert.deepEqual(JSON.parse(String(init.body)), { data: { read: true } });
      return Response.json(failWrite ? { message: "synthetic write failure" } : own, { status: failWrite ? 500 : 200 });
    }
    const queries = new URL(String(input)).searchParams.getAll("queries[]").map(q => JSON.parse(q));
    assert.ok(queries.some(q => q.attribute === "user_id" && q.values[0] === "owner"));
    return Response.json(failRead ? { message: "synthetic read failure" } : { documents }, { status: failRead ? 500 : 200 });
  };
  try {
    assert.equal(await markNotificationAsRead(own.$id, "owner"), true);
    assert.equal(writes, 1);
    documents = [{ ...own, user_id: "someone_else" }];
    assert.equal(await markNotificationAsRead(own.$id, "owner"), false);
    documents = [];
    assert.equal(await markNotificationAsRead(own.$id, "owner"), false);
    assert.equal(await markNotificationAsRead("../other", "owner"), false);
    assert.equal(await markNotificationAsRead(own.$id, ""), false);
    assert.equal(writes, 1);
    documents = [own];
    failWrite = true;
    await assert.rejects(markNotificationAsRead(own.$id, "owner"), /synthetic write failure/);
    await assert.rejects(markAllNotificationsAsRead("owner"), /synthetic write failure/);
    failWrite = false;
    failRead = true;
    await assert.rejects(markNotificationAsRead(own.$id, "owner"), /synthetic read failure/);
    await assert.rejects(markAllNotificationsAsRead("owner"), /synthetic read failure/);
    failRead = false;
    await markAllNotificationsAsRead("owner");
    assert.equal(writes, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
