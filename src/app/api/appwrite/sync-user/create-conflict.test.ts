import assert from "node:assert/strict";
import { test } from "node:test";

test("account creation conflict checks ownership and preserves fresh account choices", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = {
    exports: {
      auth: async () => ({ userId: "synthetic-owner" }),
      currentUser: async () => ({
        id: "synthetic-owner", firstName: "Test", lastName: "Owner", username: null,
        primaryEmailAddressId: null, emailAddresses: [], primaryPhoneNumberId: null,
        phoneNumbers: [], imageUrl: null,
      }),
    },
  } as NodeModule;

  try {
    const { POST } = await import("./route");
    for (const ownerLink of ["different-owner", null, "synthetic-owner"]) {
      let reads = 0;
      let updates = 0;
      globalThis.fetch = async (_input, init) => {
        const method = init?.method ?? "GET";
        if (method === "GET" && String(_input).includes("/documents/synthetic-owner")) {
          reads += 1;
          if (reads === 1) return Response.json({ message: "missing" }, { status: 404 });
          return Response.json({
            clerk_id: ownerLink,
            role: "moderator", trust_score: 82, consent_accepted: false,
          });
        }
        if (method === "GET") return Response.json({ documents: [] });
        if (method === "POST") return Response.json({ message: "conflict" }, { status: 409 });
        if (method === "PATCH") {
          updates += 1;
          const data = JSON.parse(String(init?.body)).data;
          assert.equal(data.role, "moderator");
          assert.equal(data.trust_score, 82);
          assert.equal(data.consent_accepted, false);
          return Response.json({ $id: "synthetic-owner" });
        }
        throw new Error(`Unexpected request: ${method}`);
      };

      const response = await POST();
      assert.equal(response.status, ownerLink === "synthetic-owner" ? 200 : 409);
      assert.equal(reads, 2);
      assert.equal(updates, ownerLink === "synthetic-owner" ? 1 : 0);
    }
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
