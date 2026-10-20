import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserNotifications, markAllNotificationsAsRead } from "@/lib/notifications";
import { AppwriteRequestError } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
  let authenticated = false;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    authenticated = true;

    const { searchParams } = new URL(request.url);
    const requestedLimit = searchParams.get("limit");
    const rawOffset = searchParams.get("offset") ?? "0";
    const limit = requestedLimit === null ? 50 : Number(requestedLimit);
    if (requestedLimit !== null && (!/^\d+$/.test(requestedLimit) || !Number.isSafeInteger(limit) || limit < 1)) {
      return NextResponse.json({ error: "Invalid notification limit" }, { status: 400 });
    }
    if (!/^(0|[1-9]\d*)$/.test(rawOffset) || Number(rawOffset) > 10000) {
      return NextResponse.json({ error: "Invalid notification offset" }, { status: 400 });
    }
    const offset = Number(rawOffset);

    const pageSize = Math.min(limit, 100);
    const page = await getUserNotifications(userId, Math.min(pageSize + 1, 100), offset);
    const notifications = page.slice(0, pageSize);
    const hasMore = offset + pageSize <= 10000 && (
      page.length > pageSize
      || (pageSize === 100 && page.length === 100
        && (await getUserNotifications(userId, 1, offset + 100)).length > 0)
    );

    return NextResponse.json({ notifications, hasMore });
  } catch (error) {
    console.error("Notifications fetch error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: authenticated ? "Alerts could not load. Please try again." : "Unable to load your account. Please try again." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  let authenticated = false;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    authenticated = true;

    await markAllNotificationsAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications as read error:", error instanceof AppwriteRequestError ? `Appwrite status ${error.status}` : "Unexpected error");
    return NextResponse.json(
      { error: authenticated
        ? "Some alerts may have been marked as read. Refresh alerts before trying again."
        : "Unable to load your account. Please try again." },
      { status: 503 },
    );
  }
}
