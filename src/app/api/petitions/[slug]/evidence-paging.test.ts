import assert from "node:assert/strict";
import { test } from "node:test";

test("petition detail pages through linked evidence and retains a partial page after a read failure", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;

  try {
    const requests: number[] = [];
    let failSecondPage = false;
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "petitions") {
        return Response.json({ documents: [{ $id: "synthetic-petition", slug: "synthetic", status: "open", title: "Synthetic petition", evidence_count: 101 }] });
      }
      if (collection === "users") return Response.json({ documents: [] });
      if (collection === "evidence") {
        const offsetQuery = url.searchParams.getAll("queries[]")
          .map((query) => JSON.parse(query) as { method: string; values?: number[] })
          .find((query) => query.method === "offset");
        const offset = offsetQuery?.values?.[0] ?? 0;
        requests.push(offset);
        if (offset === 100 && failSecondPage) return Response.json({ message: "Synthetic failure" }, { status: 503 });
        return Response.json({ documents: Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) => ({
          $id: `synthetic-evidence-${offset + index}`, issue_id: "synthetic-petition", type: "text/plain", file_url: "https://example.test/evidence",
        })) });
      }
      throw new Error("Unexpected request");
    };

    const { GET } = await import("./route");
    const request = new Request("https://example.test/api/petitions/synthetic");
    const context = { params: Promise.resolve({ slug: "synthetic" }) };
    let response = await GET(request, context);
    assert.equal(response.status, 200);
    let body = await response.json();
    assert.equal(body.petition.evidence.length, 101);
    assert.equal(body.evidenceUnavailable, false);
    assert.deepEqual(requests, [0, 100]);

    failSecondPage = true;
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      response = await GET(request, context);
    } finally {
      console.warn = originalWarn;
    }
    body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.petition.evidence.length, 100);
    assert.equal(body.evidenceUnavailable, true);
    assert.equal("created_by" in body.petition, false);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
