export function preservedAccountFields(existingDoc: Record<string, unknown> | null) {
  return {
    role: typeof existingDoc?.role === "string" ? existingDoc.role : "citizen",
    trust_score: typeof existingDoc?.trust_score === "number" ? existingDoc.trust_score : 10,
    consent_accepted: typeof existingDoc?.consent_accepted === "boolean" ? existingDoc.consent_accepted : true,
  };
}
