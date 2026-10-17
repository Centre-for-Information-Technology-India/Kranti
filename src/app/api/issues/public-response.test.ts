import assert from "node:assert/strict";
import { test } from "node:test";

test("public issue replies hide creator IDs while moderators retain them", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const rolePath = require.resolve("../../../lib/role-lookup");
  const originalClerk = require.cache[clerkPath];
  const originalRole = require.cache[rolePath];
  let viewerId: string | null = null;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: viewerId }) } } as NodeModule;
  require.cache[rolePath] = { exports: { getUserRole: async () => "moderator" } } as NodeModule;

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      const documents = collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", created_by: "private-clerk-id", private_note: "private" }]
        : collection === "users"
          ? [{ $id: "private-clerk-id", display_name: "Citizen" }]
          : [];
      return Response.json({ documents });
    };

    const publicResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(publicResponse.status, 200);
    const publicIssue = (await publicResponse.json()).issues[0];
    assert.equal(publicIssue.creatorName, "Citizen");
    assert.equal("created_by" in publicIssue, false);
    assert.equal("private_note" in publicIssue, false);

    viewerId = "synthetic-moderator";
    const moderatorResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(moderatorResponse.status, 200);
    const moderatorIssue = (await moderatorResponse.json()).issues[0];
    assert.equal(moderatorIssue.created_by, "private-clerk-id");
    assert.equal("private_note" in moderatorIssue, false);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    if (originalRole) require.cache[rolePath] = originalRole;
    else delete require.cache[rolePath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
