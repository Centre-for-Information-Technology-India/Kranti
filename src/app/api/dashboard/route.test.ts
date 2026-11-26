import assert from "node:assert/strict";
import { test } from "node:test";

test("dashboard groups synthetic cases without returning creator IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.APPWRITE_API_KEY;
  const clerkPath = require.resolve("@clerk/nextjs/server");
  const originalClerk = require.cache[clerkPath];
  let authFailure = false;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => {
    if (authFailure) throw new Error("Synthetic Clerk outage");
    return { userId: "synthetic_owner" };
  } } } as NodeModule;

  try {
    const { GET } = await import("./route");
    let profileFailure = false;
    let conflictingProfile = false;
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
      const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
      const field = (name: string) => queries.find((query) => query.method === "equal" && query.attribute === name)?.values;
      if (collection === "users") {
        if (profileFailure) return Response.json({ message: "Synthetic profile outage" }, { status: 503 });
        return Response.json({ documents: [{ $id: "synthetic_profile", clerk_id: "synthetic_other", ...(conflictingProfile ? { clerkUserId: "synthetic_foreign" } : {}), display_name: "Case creator" }] });
      }
      const documents = collection === "issues"
        ? field("created_by") ? [{ $id: "owned_issue", title: "Owned issue", status: "pending_review", created_by: "synthetic_owner", private_note: "private" }]
          : field("$id") ? [
            { $id: "backed_issue", title: "Backed issue", status: "open", created_by: "synthetic_other", private_note: "private" },
            { $id: "hidden_issue", title: "Hidden issue", status: "rejected", created_by: "synthetic_other", private_note: "private" },
          ] : []
        : collection === "petitions"
          ? field("created_by") ? [{ $id: "owned_petition", title: "Owned petition", status: "pending_review", created_by: "synthetic_owner", private_note: "private" }]
            : field("$id") ? [
              { $id: "signed_petition", title: "Signed petition", status: "open", created_by: "synthetic_other", private_note: "private" },
              { $id: "hidden_petition", title: "Hidden petition", status: "withdrawn", created_by: "synthetic_other", private_note: "private" },
            ] : []
          : collection === "supports" ? [
            { issue_id: "backed_issue", user_id: "synthetic_owner" },
            { issue_id: "hidden_issue", user_id: "synthetic_owner" },
          ]
          : collection === "signatures" ? [
            { petition_id: "signed_petition", user_id: "synthetic_owner" },
            { petition_id: "hidden_petition", user_id: "synthetic_owner" },
          ]
          : [];
      return Response.json({ documents });
    };

    const response = await GET();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.raisedIssues.map((item: { $id: string }) => item.$id), ["owned_issue"]);
    assert.deepEqual(body.supportedIssues.map((item: { $id: string }) => item.$id), ["backed_issue"]);
    assert.deepEqual(body.raisedPetitions.map((item: { $id: string }) => item.$id), ["owned_petition"]);
    assert.deepEqual(body.signedPetitions.map((item: { $id: string }) => item.$id), ["signed_petition"]);
    assert.equal(JSON.stringify(body).includes("Hidden issue"), false);
    assert.equal(JSON.stringify(body).includes("Hidden petition"), false);
    for (const group of [body.raisedIssues, body.supportedIssues, body.raisedPetitions, body.signedPetitions]) {
      assert.equal(group.length, 1);
      assert.equal("created_by" in group[0], false);
      assert.equal("private_note" in group[0], false);
    }
    assert.equal(body.supportedIssues[0].creatorName, "Case creator");

    conflictingProfile = true;
    const conflictResponse = await GET();
    assert.equal(conflictResponse.status, 200);
    const conflictBody = await conflictResponse.json();
    assert.equal(conflictBody.supportedIssues[0].creatorName, "Citizen Reporter");
    assert.equal(conflictBody.signedPetitions[0].creatorName, "Citizen");
    conflictingProfile = false;

    profileFailure = true;
    const outageResponse = await GET();
    assert.equal(outageResponse.status, 200);
    const outageBody = await outageResponse.json();
    assert.equal(outageBody.supportedIssues[0].creatorName, "Citizen Reporter");
    assert.equal(outageBody.signedPetitions[0].creatorName, "Citizen");
    assert.equal(outageBody.raisedIssues.length, 1);
    assert.equal(outageBody.signedPetitions.length, 1);
    assert.equal("created_by" in outageBody.supportedIssues[0], false);

    profileFailure = false;
    for (const stage of [
      "issue_owned", "issue_participation", "issue_joined",
      "petition_owned", "petition_participation", "petition_joined",
    ]) {
      globalThis.fetch = async (input) => {
        const url = new URL(String(input));
        const collection = url.pathname.split("/collections/")[1]?.split("/")[0];
        const queries = url.searchParams.getAll("queries[]").map((query) => JSON.parse(query));
        const field = (name: string) => queries.some((query) => query.method === "equal" && query.attribute === name);
        const kind = collection === "issues" ? "issue" : collection === "petitions" ? "petition" : "";
        const readStage = collection === "supports" ? "issue_participation"
          : collection === "signatures" ? "petition_participation"
            : kind && field("created_by") ? `${kind}_owned`
              : kind && field("$id") ? `${kind}_joined` : "";
        if (readStage === stage) return Response.json({ message: "Private citizen detail" }, { status: 503 });
        if (collection === "supports") return Response.json({ documents: [{ issue_id: "backed_issue", user_id: "synthetic_owner" }] });
        if (collection === "signatures") return Response.json({ documents: [{ petition_id: "signed_petition", user_id: "synthetic_owner" }] });
        return Response.json({ documents: [] });
      };
      const readFailureResponse = await GET();
      assert.equal(readFailureResponse.status, 503, stage);
      const readFailureBody = await readFailureResponse.json();
      assert.equal(readFailureBody.readStage, stage);
      assert.equal(JSON.stringify(readFailureBody).includes("Private citizen detail"), false);
    }

    authFailure = true;
    let appwriteRequests = 0;
    globalThis.fetch = async () => {
      appwriteRequests += 1;
      throw new Error("Appwrite should not be called");
    };
    const authResponse = await GET();
    assert.equal(authResponse.status, 503);
    assert.match((await authResponse.json()).error, /account.*try again/i);
    assert.equal(appwriteRequests, 0);
  } finally {
    if (originalClerk) require.cache[clerkPath] = originalClerk;
    else delete require.cache[clerkPath];
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.APPWRITE_API_KEY;
    else process.env.APPWRITE_API_KEY = originalKey;
  }
});
