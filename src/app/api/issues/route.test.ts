import assert from "node:assert/strict";
import { test } from "node:test";
import { issueSubmissionSchema } from "@/lib/issue-form";

test("issue landmarks stay within the live collection limit", () => {
  const payload = {
    title: "Synthetic broken streetlight",
    description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
    category: "infrastructure",
    state: "Test State",
    district: "Test District",
    landmark: "x".repeat(256),
    evidenceLevel: "low",
    language: "en",
    consent: true,
  };
  assert.equal(issueSubmissionSchema.safeParse(payload).success, false);
  assert.equal(issueSubmissionSchema.safeParse({ ...payload, landmark: "x".repeat(255) }).success, true);
});

test("an uncertain issue save tells citizens to check before retrying", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => ({ id: "synthetic_owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let writes = 0;
    globalThis.fetch = async () => {
      writes += 1;
      return Response.json({ message: "Synthetic Appwrite failure" }, { status: 503 });
    };
    const request = new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic broken streetlight",
          description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
          category: "infrastructure",
          state: "Test State",
          district: "Test District",
          landmark: "Test Landmark",
          evidenceLevel: "low",
          evidenceLinks: [],
          language: "en",
          consent: true,
        },
        evidence: [],
      }),
    });

    const response = await POST(request);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /check your dashboard before trying again/i);
    assert.equal(writes, 1);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("an issue ID conflict never overwrites an existing issue", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => ({ id: "synthetic_owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    const methods: string[] = [];
    globalThis.fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return Response.json({ message: "Document already exists" }, { status: 409 });
    };
    const request = new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic broken streetlight",
          description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
          category: "infrastructure",
          state: "Test State",
          district: "Test District",
          landmark: "Test Landmark",
          evidenceLevel: "low",
          evidenceLinks: [],
          language: "en",
          consent: true,
        },
        evidence: [],
      }),
    });

    const response = await POST(request);
    assert.equal(response.status, 503);
    assert.deepEqual(methods, ["POST"]);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("a saved issue reply contains only its link fields", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic_owner" }),
      currentUser: async () => ({ id: "synthetic_owner" }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    let savedData: Record<string, unknown> | undefined;
    globalThis.fetch = async (_input, init) => {
      savedData = JSON.parse(String(init?.body)).data;
      return Response.json({ $id: "synthetic_issue", private_note: "do not return" });
    };
    const request = new Request("https://example.test/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload: {
          title: "Synthetic broken streetlight",
          description: "This synthetic report contains enough text to pass validation. It does not name a real location or citizen.",
          category: "infrastructure",
          state: "Test State",
          district: "Test District",
          landmark: "Test Landmark",
          evidenceLevel: "low",
          evidenceLinks: [],
          language: "en",
          consent: true,
        },
        evidence: [],
      }),
    });

    const response = await POST(request);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), ["evidenceSaved", "issueId", "issueSlug", "ok"]);
    assert.equal(body.ok, true);
    assert.equal(body.evidenceSaved, true);
    assert.match(body.issueSlug, /^synthetic-broken-streetlight-issue/);
    assert.equal(savedData?.landmark, "Test Landmark");
    assert.equal(savedData?.status, "pending_review");
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
