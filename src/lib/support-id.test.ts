import assert from "node:assert/strict";
import { test } from "node:test";

import { belongsToSupporter, legacySupportDocumentId, supportDocumentId } from "./support-id";

test("support IDs distinguish citizens whose legacy IDs collide", () => {
  const issueId = "issuemg7w0zfabc1234";
  const first = "user_abc123_first";
  const second = "user_abc123_second";

  assert.equal(legacySupportDocumentId(issueId, first), legacySupportDocumentId(issueId, second));
  assert.notEqual(supportDocumentId(issueId, first), supportDocumentId(issueId, second));
  assert.equal(supportDocumentId(issueId, first), supportDocumentId(issueId, first));
  assert.ok(supportDocumentId(issueId, first).length <= 36);
});

test("legacy support only counts for its actual issue and citizen", () => {
  const document = { issue_id: "issue-a", user_id: "user-a", kind: "support" };
  assert.equal(belongsToSupporter(document, "issue-a", "user-a"), true);
  assert.equal(belongsToSupporter(document, "issue-a", "user-b"), false);
  assert.equal(belongsToSupporter(document, "issue-b", "user-a"), false);
});
