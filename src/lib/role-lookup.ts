import {
  AppwriteRequestError,
  appwriteDatabaseId,
  appwriteUsersCollectionId,
  getDocument,
  listDocuments,
  Query,
} from "@/lib/appwrite";
import { belongsToClerkAccount } from "@/lib/account-sync";

type RoleLookup = {
  getDocument: typeof getDocument;
  listDocuments: typeof listDocuments;
};

export async function getUserRole(
  clerkId: string,
  email: string | null,
  lookup: RoleLookup = { getDocument, listDocuments },
): Promise<string> {
  try {
    const doc = await lookup.getDocument(appwriteDatabaseId, appwriteUsersCollectionId, clerkId) as Record<string, unknown>;
    return belongsToClerkAccount(doc, clerkId) ? String(doc.role ?? "citizen") : "citizen";
  } catch (error) {
    // Only a missing document permits the seeded-user fallback.
    if (!(error instanceof AppwriteRequestError) || error.status !== 404) throw error;
  }

  const byClerkId = await lookup.listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
    Query.equal("clerk_id", [clerkId]),
    Query.limit(1),
  ]);
  const linkedUser = (byClerkId as { documents?: Array<Record<string, unknown>> }).documents?.[0];
  if (linkedUser && belongsToClerkAccount(linkedUser, clerkId)) return String(linkedUser.role ?? "citizen");

  if (email) {
    const byEmail = await lookup.listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
      Query.equal("email", [email]),
      Query.limit(1),
    ]);
    const seededUser = (byEmail as { documents?: Array<Record<string, unknown>> }).documents?.[0];
    if (seededUser && belongsToClerkAccount(seededUser, clerkId)) return String(seededUser.role ?? "citizen");
  }

  return "citizen";
}
