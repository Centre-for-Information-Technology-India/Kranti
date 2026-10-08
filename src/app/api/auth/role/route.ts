import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/role-lookup";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await currentUser();
    if (!user) throw new Error("Clerk user unavailable");
    const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? null;
    const role = await getUserRole(userId, email);
    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ error: "Unable to check your role. Please try again." }, { status: 503 });
  }
}
