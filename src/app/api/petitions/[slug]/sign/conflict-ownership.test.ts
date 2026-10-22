import assert from "node:assert/strict";
import { test } from "node:test";

for (const scenario of ["owned", "foreign", "unreadable"] as const) {
  test(`signature conflict ${scenario} result`, async () => {
    const originalFetch = globalThis.fetch;
    const originalKey = process.env.APPWRITE_API_KEY;
    const clerkPath = require.resolve("@clerk/nextjs/server");
    const originalClerk = require.cache[clerkPath];
    process.env.APPWRITE_API_KEY = "synthetic-test-key";
    require.cache[clerkPath] = {
      exports: { auth: async () => ({ userId: "synthetic_signer" }) },
    } as NodeModule;

    try {
      const { POST } = await import("./route");
      const requests: string[] = [];
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        requests.push(`${method} ${url}`);
        if (url.includes("/collections/petitions/") && method === "GET") {
          return Response.json({ documents: [{ $id: "synthetic_petition", title: "Synthetic petition", status: "open" }] });
        }
        if (url.includes("/collections/signatures/") && method === "GET" && url.includes("?")) {
          return Response.json({ documents: [] });
        }
        if (url.includes("/collections/signatures/") && method === "POST") {
          return Response.json({ message: "Document already exists" }, { status: 409 });
        }
        if (url.includes("/collections/signatures/") && method === "GET") {
          if (scenario === "unreadable") return Response.json({ message: "Unavailable" }, { status: 503 });
          return Response.json({ petition_id: scenario === "owned" ? "synthetic_petition" : "another_petition", user_id: "synthetic_signer" });
        }
        throw new Error("Unexpected storage request");
      };

      const response = await POST(new Request("https://example.test/api/petitions/synthetic/sign", { method: "POST" }), {
        params: Promise.resolve({ slug: "synthetic" }),
      });
      const body = await response.json();
      assert.equal(response.status, scenario === "owned" ? 200 : 503);
      assert.equal(body.alreadySigned, scenario === "owned" ? true : undefined);
      assert.deepEqual(requests.map((entry) => entry.split(" ")[0]), ["GET", "GET", "POST", "GET"]);
    } finally {
      if (originalClerk) require.cache[clerkPath] = originalClerk;
      else delete require.cache[clerkPath];
      globalThis.fetch = originalFetch;
      if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
      else process.env.APPWRITE_API_KEY = originalKey;
    }
  });
}
