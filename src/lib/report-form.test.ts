import assert from "node:assert/strict";
import test from "node:test";

import { reportEvidenceSchema } from "./report-form";

const validFile = {
  fileId: "marked-file",
  name: "marked-evidence.jpg",
  size: 128,
  mimeType: "image/jpeg",
  publicUrl: "https://example.test/marked-file",
};

test("incident evidence accepts a valid uploaded file", () => {
  assert.equal(reportEvidenceSchema.safeParse([validFile]).success, true);
});

test("incident evidence rejects malformed items before file processing", () => {
  for (const evidence of [
    [],
    [null],
    [validFile, null],
    [{ ...validFile, fileId: 12 }],
    [{ ...validFile, size: -1 }],
    [{ ...validFile, mimeType: null }],
    [{ ...validFile, publicUrl: {} }],
  ]) {
    assert.equal(reportEvidenceSchema.safeParse(evidence).success, false);
  }
});
