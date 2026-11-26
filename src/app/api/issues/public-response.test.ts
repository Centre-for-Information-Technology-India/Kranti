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
  let viewerRole = "moderator";
  let failRoleLookup = false;
  let failCreatorLookup = false;
  let failEvidenceLookup = false;
  let failIssueLookup = false;
  let conflictingCreatorLink = false;
  let issueStatus = "open";
  let issueQuery = "";
  let linkedReads = 0;
  process.env.APPWRITE_API_KEY = "synthetic-test-key";
  require.cache[clerkPath] = { exports: { auth: async () => ({ userId: viewerId }), currentUser: async () => null } } as NodeModule;
  require.cache[rolePath] = { exports: { getUserRole: async () => {
    if (failRoleLookup) throw new Error("Synthetic role outage");
    return viewerRole;
  } } } as NodeModule;

  try {
    const { GET } = await import("./route");
    globalThis.fetch = async (input) => {
      const collection = new URL(String(input)).pathname.split("/collections/")[1]?.split("/")[0];
      if (collection === "issues") issueQuery = decodeURIComponent(String(input));
      if (collection === "users" || collection === "evidence") linkedReads += 1;
      if (collection === "issues" && failIssueLookup) {
        return Response.json({ message: "Synthetic issue outage" }, { status: 503 });
      }
      if (collection === "users" && failCreatorLookup) {
        return Response.json({ message: "Synthetic profile outage" }, { status: 503 });
      }
      if (collection === "evidence" && failEvidenceLookup) {
        return Response.json({ message: "Synthetic evidence outage" }, { status: 503 });
      }
      const documents = collection === "issues"
        ? [{ $id: "synthetic-issue", slug: "synthetic", title: "Synthetic issue", description: "synthetic citizen text", status: issueStatus, created_by: "private-clerk-id", private_note: "private", evidence_count: 2 }]
        : collection === "users"
          ? [{ $id: "private-clerk-id", clerk_id: conflictingCreatorLink ? "different-clerk-id" : "private-clerk-id", display_name: "Citizen", avatar_url: "https://example.test/citizen.png" }]
          : collection === "evidence"
            ? [{ $id: "synthetic-evidence", issue_id: "synthetic-issue", file_name: "private-person-name.jpg", file_url: "javascript:alert(1)" }]
          : [];
      return Response.json({ documents });
    };

    const publicResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(publicResponse.status, 200);
    assert.match(issueQuery, /open/);
    assert.doesNotMatch(issueQuery, /pending_review|rejected/);
    const publicIssue = (await publicResponse.json()).issues[0];
    assert.equal(publicIssue.creatorName, "Citizen");
    assert.equal("created_by" in publicIssue, false);
    assert.equal("private_note" in publicIssue, false);
    assert.equal(publicIssue.evidence[0].name, "Evidence");
    assert.equal(publicIssue.evidence[0].publicUrl, "");
    assert.doesNotMatch(JSON.stringify(publicIssue), /private-person-name/);

    issueStatus = "pending_review";
    const linkedReadsBeforeDenied = linkedReads;
    const unreviewedResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(unreviewedResponse.status, 200);
    const unreviewedBody = await unreviewedResponse.json();
    assert.deepEqual(unreviewedBody.issues, []);
    assert.doesNotMatch(JSON.stringify(unreviewedBody), /synthetic citizen text|private-clerk-id/);
    assert.equal(linkedReads, linkedReadsBeforeDenied);
    issueStatus = "rejected";
    const rejectedResponse = await GET(new Request("https://example.test/api/issues"));
    const rejectedBody = await rejectedResponse.json();
    assert.deepEqual(rejectedBody.issues, []);
    assert.doesNotMatch(JSON.stringify(rejectedBody), /synthetic citizen text|private-clerk-id/);
    assert.equal(linkedReads, linkedReadsBeforeDenied);
    issueStatus = "open";

    conflictingCreatorLink = true;
    const mismatchedResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(mismatchedResponse.status, 200);
    const mismatchedIssue = (await mismatchedResponse.json()).issues[0];
    assert.equal(mismatchedIssue.creatorName, "Citizen Reporter");
    assert.equal(mismatchedIssue.creatorAvatar, "");
    conflictingCreatorLink = false;

    viewerId = "synthetic-moderator";
    const moderatorResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(moderatorResponse.status, 200);
    const moderatorIssue = (await moderatorResponse.json()).issues[0];
    assert.equal(moderatorIssue.created_by, "private-clerk-id");
    assert.equal("private_note" in moderatorIssue, false);

    const reviewerResponse = await GET(new Request("https://example.test/api/issues?review=1"));
    assert.equal(reviewerResponse.status, 200);
    assert.match(issueQuery, /pending_review/);
    assert.equal((await reviewerResponse.json()).issues[0].created_by, "private-clerk-id");

    const pendingResponse = await GET(new Request("https://example.test/api/issues?review=1&status=pending_review"));
    assert.equal(pendingResponse.status, 200);
    assert.match(issueQuery, /pending_review/);
    assert.doesNotMatch(issueQuery, /open|escalated|resolved/);

    issueStatus = "rejected";
    const rejectedReviewResponse = await GET(new Request("https://example.test/api/issues?review=1"));
    assert.deepEqual((await rejectedReviewResponse.json()).issues, []);
    issueStatus = "open";

    viewerRole = "citizen";
    issueQuery = "";
    const citizenReview = await GET(new Request("https://example.test/api/issues?review=1"));
    assert.equal(citizenReview.status, 403);
    assert.equal(issueQuery, "");

    failRoleLookup = true;
    const failedReview = await GET(new Request("https://example.test/api/issues?review=1"));
    assert.equal(failedReview.status, 503);
    failRoleLookup = false;
    viewerRole = "moderator";

    viewerId = null;
    const guestReview = await GET(new Request("https://example.test/api/issues?review=1"));
    assert.equal(guestReview.status, 401);
    failCreatorLookup = true;
    const fallbackResponse = await GET(new Request("https://example.test/api/issues"));
    assert.equal(fallbackResponse.status, 200);
    const fallbackIssue = (await fallbackResponse.json()).issues[0];
    assert.equal(fallbackIssue.creatorName, "Citizen Reporter");
    assert.equal("created_by" in fallbackIssue, false);

    failEvidenceLookup = true;
    const evidenceFailure = await GET(new Request("https://example.test/api/issues"));
    assert.equal(evidenceFailure.status, 200);
    const evidenceFailureBody = await evidenceFailure.json();
    assert.equal(evidenceFailureBody.evidenceUnavailable, true);
    assert.equal(evidenceFailureBody.issues[0].title, "Synthetic issue");
    assert.equal(evidenceFailureBody.issues[0].evidence_count, 2);
    assert.deepEqual(evidenceFailureBody.issues[0].evidence, []);
    assert.equal("created_by" in evidenceFailureBody.issues[0], false);

    failIssueLookup = true;
    const issueFailure = await GET(new Request("https://example.test/api/issues"));
    assert.equal(issueFailure.status, 503);
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
