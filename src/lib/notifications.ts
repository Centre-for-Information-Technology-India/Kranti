import { ID } from "node-appwrite";
import {
  appwriteDatabaseId,
  appwriteNotificationsCollectionId,
  createDocument,
  listDocuments,
  Query,
  updateDocument,
} from "./appwrite";

export type NotificationType = "status_change" | "comment" | "support" | "signature" | "moderation" | "system";

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export interface NotificationRecord {
  $id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export async function createNotification(data: NotificationData): Promise<void> {
  try {
    const notificationId = ID.unique();
    await createDocument(appwriteDatabaseId, appwriteNotificationsCollectionId, notificationId, {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function getUserNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
  try {
    const response = await listDocuments(appwriteDatabaseId, appwriteNotificationsCollectionId, [
      Query.equal("user_id", [userId]),
      Query.orderDesc("created_at"),
      Query.limit(limit),
    ]);

    return response.documents.map((doc: Record<string, unknown>) => ({
      $id: doc.$id as string,
      user_id: doc.user_id as string,
      type: doc.type as NotificationType,
      title: doc.title as string,
      message: doc.message as string,
      link: doc.link as string | undefined,
      read: doc.read as boolean,
      created_at: doc.created_at as string,
    }));
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDocument(appwriteDatabaseId, appwriteNotificationsCollectionId, notificationId, {
      read: true,
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notifications = await getUserNotifications(userId, 100);
    const unreadNotifications = notifications.filter((n) => !n.read);

    await Promise.all(
      unreadNotifications.map((notification) => markNotificationAsRead(notification.$id))
    );
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

// Helper functions to create specific notification types
export async function notifyStatusChange(
  userId: string,
  contentType: string,
  contentTitle: string,
  newStatus: string,
  link: string
): Promise<void> {
  await createNotification({
    userId,
    type: "status_change",
    title: "Status Updated",
    message: `Your ${contentType} "${contentTitle}" status changed to ${newStatus}`,
    link,
  });
}

export async function notifyNewComment(
  userId: string,
  contentType: string,
  contentTitle: string,
  commenterName: string,
  link: string
): Promise<void> {
  await createNotification({
    userId,
    type: "comment",
    title: "New Comment",
    message: `${commenterName} commented on your ${contentType} "${contentTitle}"`,
    link,
  });
}

export async function notifyNewSupport(
  userId: string,
  contentType: string,
  contentTitle: string,
  supporterName: string,
  link: string
): Promise<void> {
  await createNotification({
    userId,
    type: "support",
    title: "New Support",
    message: `${supporterName} supported your ${contentType} "${contentTitle}"`,
    link,
  });
}

export async function notifyNewSignature(
  userId: string,
  petitionTitle: string,
  signerName: string,
  link: string
): Promise<void> {
  await createNotification({
    userId,
    type: "signature",
    title: "New Signature",
    message: `${signerName} signed your petition "${petitionTitle}"`,
    link,
  });
}

export async function notifyModeration(
  userId: string,
  contentType: string,
  contentTitle: string,
  action: string,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "moderation",
    title: "Moderation Update",
    message: `Your ${contentType} "${contentTitle}" has been ${action}${reason ? `: ${reason}` : ""}`,
  });
}
