import assert from "node:assert/strict";
import { test } from "node:test";

test("public petition list and detail omit stored creator IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;

  try {
    const { GET: listPetitions } = await import("./route");
    const { GET: getPetition } = await import("./[slug]/route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      const documents = collection === "petitions"
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", created_by: "private-clerk-id", private_note: "private", signature_count: 2 }]
        : collection === "users"
          ? [{ $id: "private-clerk-id", display_name: "Citizen" }]
          : [];
      return Response.json({ documents });
    };

    const listResponse = await listPetitions(new Request("https://example.test/api/petitions"));
    const detailResponse = await getPetition(new Request("https://example.test/api/petitions/synthetic"), { params: Promise.resolve({ slug: "synthetic" }) });
    assert.equal(listResponse.status, 200);
    assert.equal(detailResponse.status, 200);

    const listBody = await listResponse.json();
    const detailBody = await detailResponse.json();
    for (const petition of [listBody.petitions[0], detailBody.petition]) {
      assert.equal(petition.$id, "synthetic-petition");
      assert.equal(petition.creatorName, "Citizen");
      assert.equal("created_by" in petition, false);
      assert.equal("private_note" in petition, false);
    }
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("petition detail stays available when optional creator profiles fail", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;

  try {
    const { GET } = await import("./[slug]/route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "users") return Response.json({ message: "profile unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "petitions"
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", created_by: "private-clerk-id" }]
        : [] });
    };

    const response = await GET(new Request("https://example.test/api/petitions/synthetic"), { params: Promise.resolve({ slug: "synthetic" }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.petition.title, "Synthetic petition");
    assert.equal(body.petition.creatorName, "Citizen");
    assert.equal("created_by" in body.petition, false);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
