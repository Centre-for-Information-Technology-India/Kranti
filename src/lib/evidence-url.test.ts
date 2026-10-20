import assert from "node:assert/strict";
import { test } from "node:test";

import { issueEvidenceSchema, issueSubmissionSchema } from "./issue-form";
import { petitionEvidenceSchema, petitionSubmissionSchema } from "./petition-form";

const issue = {
  title: "Synthetic broken streetlight",
  description: "This synthetic report contains enough detail to pass issue validation without naming a real person or place.",
  category: "infrastructure",
  state: "Test State",
  district: "Test District",
  landmark: "Test Landmark",
  evidenceLevel: "low",
  language: "en",
  consent: true,
};

const petition = {
  title: "Synthetic civic petition",
  description: "This synthetic petition contains enough detail to pass validation without naming a real person or place.",
  demand: "Please inspect this synthetic issue",
  targetAuthority: "Synthetic Test Authority",
  category: "infrastructure",
  state: "Test State",
  signatureGoal: 10,
  language: "en",
  evidenceLevel: "low",
  consent: true,
};

test("issue and petition evidence reject active-content URL schemes", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>"]) {
    assert.equal(issueSubmissionSchema.safeParse({ ...issue, evidenceLinks: [url] }).success, false);
    assert.equal(petitionSubmissionSchema.safeParse({ ...petition, evidenceLinks: [url] }).success, false);
    const file = [{ fileId: "synthetic-file", name: "Synthetic file", size: 1, mimeType: "application/pdf", publicUrl: url }];
    assert.equal(issueEvidenceSchema.safeParse(file).success, false);
    assert.equal(petitionEvidenceSchema.safeParse(file).success, false);
  }
});

test("issue and petition evidence accept normal web URLs", () => {
  for (const url of ["https://example.test/evidence", "http://example.test/evidence"]) {
    assert.equal(issueSubmissionSchema.safeParse({ ...issue, evidenceLinks: [url] }).success, true);
    assert.equal(petitionSubmissionSchema.safeParse({ ...petition, evidenceLinks: [url] }).success, true);
    const file = [{ fileId: "synthetic-file", name: "Synthetic file", size: 1, mimeType: "application/pdf", publicUrl: url }];
    assert.equal(issueEvidenceSchema.safeParse(file).success, true);
    assert.equal(petitionEvidenceSchema.safeParse(file).success, true);
  }
});
