export function preservedAccountFields(existingDoc: Record<string, unknown> | null) {
  return {
    role: typeof existingDoc?.role === "string" ? existingDoc.role : "citizen",
    trust_score: typeof existingDoc?.trust_score === "number" ? existingDoc.trust_score : 10,
    consent_accepted: typeof existingDoc?.consent_accepted === "boolean" ? existingDoc.consent_accepted : true,
  };
}

export function verifiedPrimaryEmail(user: {
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string; verification: { status: string } | null }>;
}): string | null {
  const address = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  return address?.verification?.status === "verified" ? address.emailAddress : null;
}

export function verifiedPrimaryEmailForAccount(user: Parameters<typeof verifiedPrimaryEmail>[0] & { id: string }, clerkId: string): string | null {
  if (user.id !== clerkId) throw new Error("Clerk profile does not match the authenticated account");
  return verifiedPrimaryEmail(user);
}

export function belongsToClerkAccount(document: Record<string, unknown>, clerkId: string): boolean {
  const linkedId = document.clerk_id;
  return linkedId === null || linkedId === undefined || linkedId === "" || linkedId === clerkId;
}
