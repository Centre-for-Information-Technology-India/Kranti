import assert from "node:assert/strict";
import { test } from "node:test";

test("notification creation reports storage failure without undoing a saved action", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const originalError = console.error;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  const { createNotification } = await import("./notifications");
  const data = { userId: "synthetic_owner", type: "support" as const, title: "Test", message: "Synthetic fixture only" };

  try {
    globalThis.fetch = async () => Response.json({ $id: "synthetic_alert" });
    assert.equal(await createNotification(data), true);
    console.error = () => {};
    globalThis.fetch = async () => Response.json({ message: "synthetic failure" }, { status: 503 });
    assert.equal(await createNotification(data), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

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
      { method: "limit", values: [[50, 10, 100, 1, 50][requests - 1]] },
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
    assert.equal((await getUserNotifications(userId, 1000000)).length, 1);
    assert.equal((await getUserNotifications(userId, -5)).length, 1);
    assert.equal((await getUserNotifications(userId, Number.NaN)).length, 1);
    assert.equal(requests, 5);
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

test("mark all reads every page of a user's alerts", async () => {
  const originalFetch = globalThis.fetch;
  const notifications = Array.from({ length: 102 }, (_, index) => ({
    $id: `synthetic_${index}`,
    user_id: "owner",
    read: index === 50,
    created_at: "2026-10-09T00:00:00.000Z",
  }));
  const offsets: number[] = [];
  const updated = new Set<string>();

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (init?.method === "PATCH") {
      updated.add(url.pathname.split("/").at(-1) ?? "");
      return Response.json({});
    }
    const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
    assert.ok(queries.some((query) => query.attribute === "user_id" && query.values[0] === "owner"));
    const id = queries.find((query) => query.attribute === "$id")?.values[0];
    if (id) return Response.json({ documents: notifications.filter((item) => item.$id === id) });
    const offset = queries.find((query) => query.method === "offset")?.values[0];
    const limit = queries.find((query) => query.method === "limit")?.values[0];
    assert.equal(limit, 100);
    offsets.push(offset);
    return Response.json({ documents: notifications.slice(offset, offset + limit) });
  };

  try {
    const { markAllNotificationsAsRead } = await import("./notifications");
    await markAllNotificationsAsRead("owner");
    assert.deepEqual(offsets, [0, 100]);
    assert.equal(updated.size, 101);
    assert.ok(updated.has("synthetic_101"));
    assert.ok(!updated.has("synthetic_50"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
