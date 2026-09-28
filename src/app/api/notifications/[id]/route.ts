import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { markNotificationAsRead } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const updated = await markNotificationAsRead(id, userId);
    if (!updated) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
