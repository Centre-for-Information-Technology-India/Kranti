import assert from "node:assert/strict";
import { test } from "node:test";

import { AppwriteRequestError } from "./appwrite";
import { isExistingSignature, signatureDocumentId } from "./petition-signature";

test("one signer and petition always use the same Appwrite document ID", () => {
  const id = signatureDocumentId("petition-one", "user-one");
  assert.equal(id, signatureDocumentId("petition-one", "user-one"));
  assert.match(id, /^sig[a-f0-9]{32}$/);
  assert.notEqual(id, signatureDocumentId("petition-two", "user-one"));
  assert.notEqual(id, signatureDocumentId("petition-one", "user-two"));
});

test("only an Appwrite conflict means the signature was already saved", () => {
  assert.equal(isExistingSignature(new AppwriteRequestError("conflict", 409)), true);
  assert.equal(isExistingSignature(new AppwriteRequestError("unavailable", 503)), false);
  assert.equal(isExistingSignature(new Error("conflict")), false);
});
