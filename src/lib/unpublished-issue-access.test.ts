import assert from "node:assert/strict";
import { test } from "node:test";

import { canReadUnpublishedIssue } from "./unpublished-issue-access";

test("unpublished issues are private to the owner and reviewers", async () => {
  let roleLookups = 0;
  const lookup = (userId: string | null, role = "citizen") => ({
    auth: async () => ({ userId }),
    getUserRole: async () => { roleLookups += 1; return role; },
  });

  for (const status of ["rejected", "pending_review"]) {
    const issue = { status, created_by: "owner" };
    assert.equal(await canReadUnpublishedIssue(issue, lookup(null)), false);
    assert.equal(await canReadUnpublishedIssue(issue, lookup("stranger")), false);
    assert.equal(await canReadUnpublishedIssue(issue, lookup("owner")), true);
    assert.equal(await canReadUnpublishedIssue(issue, lookup("reviewer", "moderator")), true);
    assert.equal(await canReadUnpublishedIssue(issue, lookup("reviewer", "admin")), true);
    assert.equal(await canReadUnpublishedIssue(issue, {
      auth: async () => { throw new Error("synthetic Clerk outage"); },
      getUserRole: async () => "admin",
    }), false);
  }
  assert.equal(roleLookups, 6);
  assert.equal(await canReadUnpublishedIssue({ status: "open" }, lookup(null)), true);
});
