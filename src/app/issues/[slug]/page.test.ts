import assert from "node:assert/strict";
import { test } from "node:test";

test("issue detail shows a creator only when profile account links agree", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    let profile: Record<string, unknown> = {
      $id: "synthetic-owner", clerk_id: "synthetic-owner", clerkUserId: "different-owner",
      display_name: "Wrong Person", avatar_url: "https://example.test/wrong-avatar.png",
    };
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "issues") return Response.json({ documents: [{
        $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open", created_by: "synthetic-owner",
      }] });
      if (collection === "users") return Response.json({ documents: [profile] });
      return Response.json({ documents: [] });
    };
    const render = async () => {
      const seen = new WeakSet<object>();
      return JSON.stringify(await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) }), (_key, value) => {
        if (value && typeof value === "object") {
          if (seen.has(value)) return undefined;
          seen.add(value);
        }
        return value;
      });
    };

    const mismatch = await render();
    assert.match(mismatch, /Citizen Reporter/);
    assert.doesNotMatch(mismatch, /Wrong Person|wrong-avatar/);

    profile = { ...profile, clerkUserId: "synthetic-owner", display_name: "Matching Creator" };
    assert.match(await render(), /Matching Creator/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("issue detail keeps later evidence and earlier links after a later read fails", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { default: IssueDetailPage } = await import("./page");
    const offsets: number[] = [];
    let failSecondPage = false;
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "issues") return Response.json({ documents: [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", status: "open", evidence_count: 101 }] });
      if (collection === "evidence") {
        const offsetQuery = url.searchParams.getAll("queries[]")
          .map((query) => JSON.parse(query) as { method: string; values?: number[] })
          .find((query) => query.method === "offset");
        const offset = offsetQuery?.values?.[0] ?? 0;
        offsets.push(offset);
        if (offset === 100 && failSecondPage) return Response.json({ message: "Synthetic failure" }, { status: 503 });
        return Response.json({ documents: Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) => ({
          $id: `synthetic-evidence-${offset + index}`, issue_id: "synthetic-issue", type: "text/plain", file_url: `https://example.test/evidence-${offset + index}`,
        })) });
      }
      return Response.json({ documents: [] });
    };

    const renderTree = (page: unknown) => {
      const seen = new WeakSet<object>();
      return JSON.stringify(page, (_key, value) => {
        if (value && typeof value === "object") {
          if (seen.has(value)) return undefined;
          seen.add(value);
        }
        return value;
      });
    };
    const page = await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) });
    let tree = renderTree(page);
    assert.deepEqual(offsets, [0, 100]);
    assert.match(tree, /Evidence Gallery/);
    assert.match(tree, /evidence-100/);
    assert.doesNotMatch(tree, /Some evidence could not load/);

    failSecondPage = true;
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      tree = renderTree(await IssueDetailPage({ params: Promise.resolve({ slug: "synthetic" }) }));
    } finally {
      console.warn = originalWarn;
    }
    assert.match(tree, /Some evidence could not load/);
    assert.match(tree, /evidence-99/);
    assert.doesNotMatch(tree, /evidence-100/);
    assert.doesNotMatch(tree, /No evidence has been attached/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

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

test("public issue pages do not offer unsafe saved evidence links", async () => {
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
          ? [{ $id: "synthetic-evidence", issue_id: "synthetic-issue", type: "other", file_url: "javascript:alert(1)" }]
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
    assert.doesNotMatch(pageTree, /javascript:alert/);
    assert.match(pageTree, /Evidence link unavailable/);
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
