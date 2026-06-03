import { currentUser, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  appwriteDatabaseId,
  appwriteUsersCollectionId,
  getDocument,
  listDocuments,
  Query,
  updateDocument,
  upsertDocument,
} from "@/lib/appwrite";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unable to load Clerk user" }, { status: 400 });
  }

  const primaryEmail = user.emailAddresses.find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)?.emailAddress ?? null;
  const primaryPhone = user.phoneNumbers.find((phoneNumber) => phoneNumber.id === user.primaryPhoneNumberId)?.phoneNumber ?? null;

  // Check if a document already exists with this Clerk ID
  let existingDoc: Record<string, unknown> | null = null;
  try {
    existingDoc = await getDocument(appwriteDatabaseId, appwriteUsersCollectionId, user.id) as Record<string, unknown>;
  } catch {
    // Not found by Clerk ID
  }

  // If not found by Clerk ID, check if a seeded user exists with this email
  if (!existingDoc && primaryEmail) {
    try {
      const result = await listDocuments(appwriteDatabaseId, appwriteUsersCollectionId, [
        Query.equal("email", [primaryEmail]),
        Query.limit(1),
      ]);
      const found = (result as { documents?: Array<Record<string, unknown>> }).documents?.[0];
      if (found) {
        // Link the seeded document with the real Clerk ID
        await updateDocument(appwriteDatabaseId, appwriteUsersCollectionId, found.$id as string, {
          clerk_id: user.id,
          avatar_url: user.imageUrl,
        });
        return NextResponse.json({ ok: true, userId: user.id, document: found, linked: true });
      }
    } catch {
      // Continue to create new document
    }
  }

  // Preserve existing role (never escalate during sync)
  const existingRole = existingDoc?.role as string | undefined;

  const document = await upsertDocument(appwriteDatabaseId, appwriteUsersCollectionId, user.id, {
    clerk_id: user.id,
    display_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || primaryEmail || "Kranti user",
    email: primaryEmail,
    phone: primaryPhone,
    avatar_url: user.imageUrl,
    role: existingRole ?? "citizen",
    verified: Boolean(user.primaryEmailAddressId || user.primaryPhoneNumberId),
    trust_score: 10,
    consent_accepted: true,
  });

  return NextResponse.json({ ok: true, userId: user.id, document });
}
