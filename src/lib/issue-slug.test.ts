import assert from "node:assert/strict";
import test from "node:test";
import { buildIssueSlug } from "./issue-form";

test("new issue links stay distinct for repeated and Hindi-only titles", () => {
  assert.equal(buildIssueSlug("Broken streetlight", "issueOne"), "broken-streetlight-issueOne");
  assert.equal(buildIssueSlug("Broken streetlight", "issueTwo"), "broken-streetlight-issueTwo");
  assert.equal(buildIssueSlug("सड़क की बत्ती खराब", "issueThree"), "issue-issueThree");
});
