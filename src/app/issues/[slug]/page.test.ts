import assert from "node:assert/strict";
import { test } from "node:test";

test("issue details survive creator profile outages, but not evidence outages", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "users") return Response.json({ message: "profile unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open", created_by: "synthetic-clerk-id" }]
        : [] });
    };

    const page = await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) });
    assert.ok(page);
    const seen = new WeakSet<object>();
    const pageTree = JSON.stringify(page, (_key, value) => {
      if (value && typeof value === "object") {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
    assert.match(pageTree, /Citizen Reporter/);

    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "evidence") return Response.json({ message: "evidence unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open", created_by: "synthetic-clerk-id" }]
        : [] });
    };
    await assert.rejects(IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) }), /Issue details are temporarily unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("issue details remain available when initial comments fail", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "comments") return Response.json({ message: "comments unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open" }]
        : [] });
    };

    const page = await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) });
    const seen = new WeakSet<object>();
    const pageTree = JSON.stringify(page, (_key, value) => {
      if (value && typeof value === "object") {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
    assert.match(pageTree, /Synthetic issue/);
    assert.match(pageTree, /"initialLoadError":true/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
