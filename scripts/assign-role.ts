/**
 * Assign a role to a user in the Appwrite users collection.
 *
 * Usage:
 *   npx tsx scripts/assign-role.ts <email> <role>
 *
 * Example:
 *   npx tsx scripts/assign-role.ts asharamaan234@gmail.com admin
 *
 * Valid roles: admin, moderator, citizen
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT ?? "https://citorg.in/v1";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID ?? "kranti";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "kranti";
const USERS_COLLECTION_ID = process.env.APPWRITE_USERS_COLLECTION_ID ?? "users";

if (!APPWRITE_API_KEY) {
  console.error("❌ APPWRITE_API_KEY is not set in .env.local");
  process.exit(1);
}

const VALID_ROLES = ["admin", "moderator", "citizen"];

const [, , email, role] = process.argv;

if (!email || !role) {
  console.error("Usage: npx tsx scripts/assign-role.ts <email> <role>");
  console.error("Valid roles:", VALID_ROLES.join(", "));
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`❌ Invalid role "${role}". Valid roles: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

async function appwriteRequest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${APPWRITE_ENDPOINT}${path}`, {
    ...init,
    headers: {
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
      "X-Appwrite-Key": APPWRITE_API_KEY!,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body;
}

async function main() {
  console.log(`🔍 Looking up user with email: ${email}`);

  const query = encodeURIComponent(`equal("email", ["${email}"])`);
  const limit = encodeURIComponent("limit(1)");

  const result = await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${query}&queries[]=${limit}`
  );

  const user = result.documents?.[0];

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("Make sure the user has signed in at least once or is seeded.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.display_name} (${user.$id})`);
  console.log(`   Current role: ${user.role}`);

  if (user.role === role) {
    console.log(`ℹ️  User already has role "${role}". No changes needed.`);
    return;
  }

  await appwriteRequest(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${user.$id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ data: { role } }),
    }
  );

  console.log(`✅ Role updated to "${role}" for ${user.display_name} (${email})`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
