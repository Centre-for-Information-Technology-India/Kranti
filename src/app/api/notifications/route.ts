import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserNotifications, markAllNotificationsAsRead } from "@/lib/notifications";
import { AppwriteRequestError } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = searchParams.get("limit");
    const limit = requestedLimit === null ? 50 : Number(requestedLimit);
    if (requestedLimit !== null && (!/^\d+$/.test(requestedLimit) || !Number.isSafeInteger(limit) || limit < 1)) {
      return NextResponse.json({ error: "Invalid notification limit" }, { status: 400 });
    }

    const notifications = await getUserNotifications(userId, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications fetch error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json({ error: "Alerts could not load. Please try again." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markAllNotificationsAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications as read error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: "Some alerts may have been marked as read. Refresh alerts before trying again." },
      { status: 503 },
    );
  }
}
