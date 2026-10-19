import assert from "node:assert/strict";
import { test } from "node:test";

import { canReadRejectedIssue } from "./rejected-issue-access";

test("rejected issues are private to the owner and reviewers", async () => {
  const issue = { status: "rejected", created_by: "owner" };
  let roleLookups = 0;
  const lookup = (userId: string | null, role = "citizen") => ({
    auth: async () => ({ userId }),
    getUserRole: async () => { roleLookups += 1; return role; },
  });

  assert.equal(await canReadRejectedIssue(issue, lookup(null)), false);
  assert.equal(await canReadRejectedIssue(issue, lookup("stranger")), false);
  assert.equal(await canReadRejectedIssue(issue, lookup("owner")), true);
  assert.equal(await canReadRejectedIssue(issue, lookup("reviewer", "moderator")), true);
  assert.equal(await canReadRejectedIssue(issue, lookup("reviewer", "admin")), true);
  assert.equal(roleLookups, 3);
  assert.equal(await canReadRejectedIssue({ status: "open" }, lookup(null)), true);
  assert.equal(await canReadRejectedIssue(issue, {
    auth: async () => { throw new Error("synthetic Clerk outage"); },
    getUserRole: async () => "admin",
  }), false);
});
