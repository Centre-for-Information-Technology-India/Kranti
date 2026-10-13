import assert from "node:assert/strict";
import { test } from "node:test";
import { belongsToClerkAccount, preservedAccountFields, verifiedPrimaryEmail } from "./account-sync";

test("later account sync preserves stored decisions", () => {
  assert.deepEqual(preservedAccountFields({ role: "moderator", trust_score: 82, consent_accepted: false }), {
    role: "moderator",
    trust_score: 82,
    consent_accepted: false,
  });
});

test("new accounts receive existing defaults", () => {
  assert.deepEqual(preservedAccountFields(null), {
    role: "citizen",
    trust_score: 10,
    consent_accepted: true,
  });
});

test("only a verified primary email can link a seeded account", () => {
  const user = {
    primaryEmailAddressId: "primary",
    emailAddresses: [
      { id: "primary", emailAddress: "person@example.invalid", verification: { status: "unverified" } },
      { id: "other", emailAddress: "other@example.invalid", verification: { status: "verified" } },
    ],
  };
  assert.equal(verifiedPrimaryEmail(user), null);
  user.emailAddresses[0].verification.status = "verified";
  assert.equal(verifiedPrimaryEmail(user), "person@example.invalid");
});

test("a record linked to another Clerk account cannot be relinked", () => {
  assert.equal(belongsToClerkAccount({ clerk_id: "user-other" }, "user-current"), false);
  assert.equal(belongsToClerkAccount({ clerk_id: "user-current" }, "user-current"), true);
  assert.equal(belongsToClerkAccount({ $id: "seeded" }, "user-current"), true);
});
