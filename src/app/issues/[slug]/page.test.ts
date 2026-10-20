import assert from "node:assert/strict";
import { test } from "node:test";

test("escalated issues stay at the active timeline step", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      return Response.json({ documents: collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "escalated" }]
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
    assert.match(pageTree, /"Status: ","escalated"/);
    assert.match(pageTree, /"width":"66\.66666666666666%"/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("public issue pages do not render uploaded filenames", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      return Response.json({ documents: collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open" }]
        : collection === "evidence"
          ? [{ $id: "synthetic-evidence", issue_id: "synthetic-issue", file_name: "private-person-name.jpg", file_url: "https://example.test/evidence" }]
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
    assert.match(pageTree, /Evidence/);
    assert.doesNotMatch(pageTree, /private-person-name/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("issue details survive optional profile and evidence outages", async () => {
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
    const evidencePage = await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) });
    const evidenceTree = JSON.stringify(evidencePage, (_key, value) => {
      if (value && typeof value === "object") {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
    assert.match(evidenceTree, /Synthetic issue/);
    assert.match(evidenceTree, /Evidence could not load/);
    assert.match(evidenceTree, /Try again/);
    assert.doesNotMatch(evidenceTree, /No evidence has been attached/);

    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "issues") return Response.json({ message: "issue unavailable" }, { status: 503 });
      throw new Error("Related data must not be read");
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

test("issues outside the public list do not expose page data to guests", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage, generateMetadata } = await import("./page");
    let issueReads = 0;
    for (const status of ["pending_review", "rejected", "withdrawn", "unexpected"]) {
      issueReads = 0;
      globalThis.fetch = async (input) => {
        const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
        if (collection === "issues") {
          issueReads += 1;
          return Response.json({ documents: [{ $id: "synthetic-issue", slug: "synthetic", title: "Private synthetic issue", status, created_by: "owner" }] });
        }
        throw new Error("Private issue data was read");
      };

      await assert.rejects(IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) }), /NEXT_HTTP_ERROR_FALLBACK;404/);
      assert.equal(issueReads, 1);
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: "synthetic" }) });
      assert.equal(metadata.title, "Issue not found");
      assert.deepEqual(metadata.robots, { index: false, follow: false });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
