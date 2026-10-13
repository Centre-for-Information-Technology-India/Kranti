import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { belongsToClerkAccount, verifiedPrimaryEmail } from "@/lib/account-sync";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/issue/new(.*)",
  "/petition/new(.*)",
  "/campaign/new(.*)",
  "/report/new(.*)",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT ?? "https://citorg.in/v1";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID ?? "kranti";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY ?? "";
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "kranti";
const USERS_COLLECTION_ID = process.env.APPWRITE_USERS_COLLECTION_ID ?? "users";

async function appwriteFetch(path: string) {
  const res = await fetch(`${APPWRITE_ENDPOINT}${path}`, {
    headers: {
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
      "X-Appwrite-Key": APPWRITE_API_KEY,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getUserRole(clerkId: string, email?: string | null): Promise<string> {
  // 1. Try by document ID (Clerk user ID)
  const docById = await appwriteFetch(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents/${clerkId}`
  );
  if (docById?.role && belongsToClerkAccount(docById, clerkId)) return docById.role;

  // 2. Try by clerk_id field
  const queryClerkId = JSON.stringify({ method: "equal", attribute: "clerk_id", values: [clerkId] });
  const limitQ = JSON.stringify({ method: "limit", values: [1] });
  const byClerkId = await appwriteFetch(
    `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(queryClerkId)}&queries[]=${encodeURIComponent(limitQ)}`
  );
  const linkedUser = byClerkId?.documents?.[0];
  if (linkedUser?.role && belongsToClerkAccount(linkedUser, clerkId)) return linkedUser.role;

  // 3. Try by email (for seeded users)
  if (email) {
    const queryEmail = JSON.stringify({ method: "equal", attribute: "email", values: [email] });
    const byEmail = await appwriteFetch(
      `/databases/${DATABASE_ID}/collections/${USERS_COLLECTION_ID}/documents?queries[]=${encodeURIComponent(queryEmail)}&queries[]=${encodeURIComponent(limitQ)}`
    );
    const seededUser = byEmail?.documents?.[0];
    if (seededUser?.role && belongsToClerkAccount(seededUser, clerkId)) return seededUser.role;
  }

  return "citizen";
}

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      const { pathname, search } = request.nextUrl;
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect_url", `${pathname}${search}`);
      return NextResponse.redirect(redirectUrl);
    }

    // Server-side role check for admin routes
    if (isAdminRoute(request)) {
      let email: string | null = null;
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        email = verifiedPrimaryEmail(clerkUser);
      } catch {
        // If we can't get email, proceed with ID-only lookup
      }

      const role = await getUserRole(userId, email);
      if (role !== "admin" && role !== "moderator") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
