import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { verifiedPrimaryEmail } from "@/lib/account-sync";
import { getProxyUserRole } from "@/lib/proxy-role-lookup";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/issue/new(.*)",
  "/petition/new(.*)",
  "/campaign/new(.*)",
  "/report/new(.*)",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

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
      const role = await getProxyUserRole(userId, async () => {
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(userId);
          return verifiedPrimaryEmail(clerkUser);
        } catch {
          return null;
        }
      });
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
