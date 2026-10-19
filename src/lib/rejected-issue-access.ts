import { auth } from "@clerk/nextjs/server";

import { getUserRole } from "@/lib/role-lookup";

export async function canReadRejectedIssue(
  issue: Record<string, unknown>,
  lookup: {
    auth: () => Promise<{ userId: string | null }>;
    getUserRole: (userId: string, email: null) => Promise<string>;
  } = { auth, getUserRole },
): Promise<boolean> {
  if (issue.status !== "rejected") return true;

  try {
    const { userId } = await lookup.auth();
    if (!userId) return false;
    if (String(issue.created_by ?? issue.createdBy ?? "") === userId) return true;

    const role = await lookup.getUserRole(userId, null);
    return role === "admin" || role === "moderator";
  } catch {
    return false;
  }
}
