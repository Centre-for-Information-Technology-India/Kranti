import assert from "node:assert/strict";
import { test } from "node:test";
import { updateSignatureCountAfterSave } from "./petition-signature-count";

test("a saved signature stays successful when its count update fails", async () => {
  const failure = new Error("synthetic count write failure");
  const logged: unknown[] = [];

  assert.equal(await updateSignatureCountAfterSave(async () => {
    throw failure;
  }, (error) => logged.push(error)), false);
  assert.equal(logged.length, 1);
  assert.equal(logged[0], failure);

  assert.equal(await updateSignatureCountAfterSave(async () => undefined, (error) => logged.push(error)), true);
  assert.equal(logged.length, 1);
});
