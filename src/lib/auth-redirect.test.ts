import assert from "node:assert/strict";
import test from "node:test";

import { safeAuthRedirect } from "./auth-redirect";

test("keeps ordinary local return paths", () => {
  assert.equal(safeAuthRedirect("/issues/marked-case?view=latest"), "/issues/marked-case?view=latest");
  assert.equal(safeAuthRedirect("/"), "/");
});

test("rejects external and malformed return targets", () => {
  for (const target of [
    "https://outside.example/",
    "//outside.example/",
    "/\\outside.example/",
    "/%2f%2foutside.example/",
    "/%5coutside.example/",
    "\\outside.example/",
    " /issues",
    "/issues\nLocation: https://outside.example",
    ["/issues", "//outside.example"],
    undefined,
  ]) {
    assert.equal(safeAuthRedirect(target), "/dashboard");
  }
});
