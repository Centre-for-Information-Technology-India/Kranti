import assert from "node:assert/strict";
import { test } from "node:test";

test("non-public petitions stay out of public lists and saved links", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;
  let listFiltered = false;
  let relatedReads = 0;
  let hiddenStatus = "pending_review";

  try {
    const { GET: listPetitions } = await import("./route");
    const { GET: getPetition } = await import("./[slug]/route");
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      if (collection !== "petitions") {
        relatedReads++;
        return Response.json({ documents: [] });
      }
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      const status = queries.find((query) => query.attribute === "status");
      if (status) {
        listFiltered = status.method === "equal" && !["pending_review", "rejected", "withdrawn"].some((value) => status.values.includes(value));
        return Response.json({ documents: [] });
      }
      return Response.json({ documents: [{ $id: "synthetic-pending", slug: "synthetic-pending", status: hiddenStatus }] });
    };

    const listResponse = await listPetitions(new Request("https://example.test/api/petitions"));
    assert.equal(listResponse.status, 200);
    assert.equal(listFiltered, true);
    assert.deepEqual((await listResponse.json()).petitions, []);

    for (const status of ["pending_review", "rejected", "withdrawn", "unexpected"]) {
      hiddenStatus = status;
      const detailResponse = await getPetition(new Request("https://example.test/api/petitions/synthetic-pending"), {
        params: Promise.resolve({ slug: "synthetic-pending" }),
      });
      assert.equal(detailResponse.status, 404, status);
    }
    assert.equal(relatedReads, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});

test("public petition list and detail omit stored creator IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: null }) } } as NodeModule;
  let profileOwner = "private-clerk-id";

  try {
    const { GET: listPetitions } = await import("./route");
    const { GET: getPetition } = await import("./[slug]/route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      const documents = collection === "petitions"
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", status: "open", created_by: "private-clerk-id", private_note: "private", signature_count: 2 }]
        : collection === "users"
          ? [{ $id: "private-clerk-id", clerk_id: profileOwner, display_name: "Named Citizen", avatar_url: "https://example.test/avatar.png" }]
          : collection === "evidence"
            ? [{ $id: "synthetic-evidence", issue_id: "synthetic-petition", file_name: "private-person-name.jpg", file_url: "javascript:alert(1)" }]
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
      assert.equal(petition.creatorName, "Named Citizen");
      assert.equal("created_by" in petition, false);
      assert.equal("private_note" in petition, false);
      assert.equal(petition.evidence[0].name, "Evidence");
      assert.equal(petition.evidence[0].publicUrl, "");
      assert.doesNotMatch(JSON.stringify(petition), /private-person-name/);
    }

    profileOwner = "another-clerk-id";
    const mismatchedList = await listPetitions(new Request("https://example.test/api/petitions"));
    const mismatchedDetail = await getPetition(new Request("https://example.test/api/petitions/synthetic"), { params: Promise.resolve({ slug: "synthetic" }) });
    for (const petition of [(await mismatchedList.json()).petitions[0], (await mismatchedDetail.json()).petition]) {
      assert.equal(petition.creatorName, "Citizen");
      assert.equal(petition.creatorAvatar, "");
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
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", status: "open", created_by: "private-clerk-id" }]
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

test("petition list keeps cases when optional creator profiles fail", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "users") return Response.json({ message: "profile unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "petitions"
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", status: "open", created_by: "private-clerk-id" }]
        : [] });
    };

    const response = await GET(new Request("https://example.test/api/petitions"));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.petitions[0].title, "Synthetic petition");
    assert.equal(body.petitions[0].creatorName, "Citizen");
    assert.equal("created_by" in body.petitions[0], false);

    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "evidence") return Response.json({ message: "evidence unavailable" }, { status: 503 });
      return Response.json({ documents: collection === "petitions"
        ? [{ $id: "synthetic-petition", slug: "synthetic", title: "Synthetic petition", status: "open", created_by: "private-clerk-id", evidence_count: 2 }]
        : [] });
    };
    const evidenceFailureResponse = await GET(new Request("https://example.test/api/petitions"));
    assert.equal(evidenceFailureResponse.status, 200);
    const evidenceFailureBody = await evidenceFailureResponse.json();
    assert.equal(evidenceFailureBody.evidenceUnavailable, true);
    assert.equal(evidenceFailureBody.petitions[0].title, "Synthetic petition");
    assert.equal(evidenceFailureBody.petitions[0].evidence_count, 2);
    assert.deepEqual(evidenceFailureBody.petitions[0].evidence, []);
    assert.equal("created_by" in evidenceFailureBody.petitions[0], false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
