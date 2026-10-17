import { belongsToClerkAccount } from "@/lib/account-sync";

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT ?? "https://citorg.in/v1";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID ?? "kranti";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY ?? "";
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "kranti";
const USERS_COLLECTION_ID = process.env.APPWRITE_USERS_COLLECTION_ID ?? "users";

async function appwriteFetch(path: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${APPWRITE_ENDPOINT}${path}`, {
    headers: {
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
      "X-Appwrite-Key": APPWRITE_API_KEY,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function getProxyUserRole(
  clerkId: string,
  resolveVerifiedEmail: () => Promise<string | null>,
  readDocument: typeof appwriteFetch = appwriteFetch,
): Promise<string> {
  const docById = await readDocument(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${clerkId}`,
  );
  if (docById?.role && belongsToClerkAccount(docById, clerkId)) return String(docById.role);

  const limitQ = JSON.stringify({ method: "limit", values: [1] });
  const queryClerkId = JSON.stringify({ method: "equal", attribute: "clerk_id", values: [clerkId] });
  const byClerkId = await readDocument(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(queryClerkId)}&queries[]=${encodeURIComponent(limitQ)}`,
  );
  const linkedUser = (byClerkId?.documents as Array<Record<string, unknown>> | undefined)?.[0];
  if (linkedUser?.role && belongsToClerkAccount(linkedUser, clerkId)) return String(linkedUser.role);

  // Only accounts without a linked role need Clerk's optional profile data.
  const email = await resolveVerifiedEmail();
  if (email) {
    const queryEmail = JSON.stringify({ method: "equal", attribute: "email", values: [email] });
    const byEmail = await readDocument(
      `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(queryEmail)}&queries[]=${encodeURIComponent(limitQ)}`,
    );
    const seededUser = (byEmail?.documents as Array<Record<string, unknown>> | undefined)?.[0];
    if (seededUser?.role && belongsToClerkAccount(seededUser, clerkId)) return String(seededUser.role);
  }

  return "citizen";
}
