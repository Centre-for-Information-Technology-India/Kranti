import { createHash } from "node:crypto";

import { AppwriteRequestError } from "./appwrite";

// A stable Appwrite ID makes concurrent requests from the same signer conflict.
export function signatureDocumentId(petitionId: string, userId: string): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([petitionId, userId]))
    .digest("hex")
    .slice(0, 32);
  return `sig${digest}`;
}

export function isExistingSignature(error: unknown): boolean {
  return error instanceof AppwriteRequestError && error.status === 409;
}
