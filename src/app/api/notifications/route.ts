import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserNotifications, markAllNotificationsAsRead } from "@/lib/notifications";

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
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
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
    console.error("Mark notifications as read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
