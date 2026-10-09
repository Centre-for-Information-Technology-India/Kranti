import assert from "node:assert/strict";
import { test } from "node:test";
import { preservedAccountFields } from "./account-sync";

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
