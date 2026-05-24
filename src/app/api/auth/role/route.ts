import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteUsersCollectionId,
  getDocument,
  listDocuments,
  Query,
} from "@/lib/appwrite";

export const runtime = "nodejs";

async function getUserRole(clerkId: string, email: string | null): Promise<string> {
  // Try by document ID (Clerk user ID)
  try {
    const doc = await getDocument(appwriteDatabaseId, appwriteUsersCollectionId, clerkId) as Record<string, unknown>;
    return String(doc.role ?? "citizen");
  } catch {
    // Not found
  }

  // Try by clerk_id field
  try {
    const result = await listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
      Query.equal("clerk_id", [clerkId]),
      Query.limit(1),
    ]);
    const user = (result as { documents?: Array<Record<string, unknown>> }).documents?.[0];
    if (user) return String(user.role ?? "citizen");
  } catch {
    // Not found
  }

  // Try by email (for seeded users not yet linked)
  if (email) {
    try {
      const result = await listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
        Query.equal("email", [email]),
        Query.limit(1),
      ]);
      const user = (result as { documents?: Array<Record<string, unknown>> }).documents?.[0];
      if (user) return String(user.role ?? "citizen");
    } catch {
      // Not found
    }
  }

  return "citizen";
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? null;

  const role = await getUserRole(userId, email);
  return NextResponse.json({ role });
}
