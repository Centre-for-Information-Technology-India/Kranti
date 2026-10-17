import assert from "node:assert/strict";
import { test } from "node:test";

import { getProxyUserRole } from "./proxy-role-lookup";

test("a linked admin role does not depend on Clerk profile data", async () => {
  let profileCalls = 0;
  const role = await getProxyUserRole("user-current", async () => {
    profileCalls += 1;
    throw new Error("Profile unavailable");
  }, async () => ({ role: "admin", clerk_id: "user-current" }));
  assert.equal(role, "admin");
  assert.equal(profileCalls, 0);
});

test("a linked moderator role is found before requesting a profile", async () => {
  let profileCalls = 0;
  const role = await getProxyUserRole("user-current", async () => {
    profileCalls += 1;
    return null;
  }, async (path) => path.includes("queries[]=")
    ? { documents: [{ role: "moderator", clerk_id: "user-current" }] }
    : null);
  assert.equal(role, "moderator");
  assert.equal(profileCalls, 0);
});

test("a seeded moderator role still needs a verified email", async () => {
  const role = await getProxyUserRole("user-current", async () => "verified@example.invalid", async (path) => {
    if (path.includes("%22attribute%22%3A%22email%22")) return { documents: [{ role: "moderator" }] };
    return null;
  });
  assert.equal(role, "moderator");
});

test("a foreign Clerk ID cannot grant admin access", async () => {
  const role = await getProxyUserRole("user-current", async () => "verified@example.invalid", async (path) => {
    if (path.includes("queries[]=")) return { documents: [{ role: "admin", clerk_id: "user-other" }] };
    return { role: "admin", clerk_id: "user-other" };
  });
  assert.equal(role, "citizen");
});

test("a failed profile fallback cannot grant admin access", async () => {
  const role = await getProxyUserRole("user-current", async () => null, async () => null);
  assert.equal(role, "citizen");
});

test("a storage exception cannot grant admin access", async () => {
  await assert.rejects(getProxyUserRole("user-current", async () => null, async () => {
    throw new Error("Storage unavailable");
  }));
});
