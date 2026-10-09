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

export async function createNotification(data: NotificationData): Promise<boolean> {
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
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}

export async function getUserNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
  const boundedLimit = Number.isSafeInteger(limit) ? Math.min(100, Math.max(1, limit)) : 50;
  const response = await listDocuments(appwriteDatabaseId, appwriteNotificationsCollectionId, [
    Query.equal("user_id", [userId]),
    Query.orderDesc("created_at"),
    Query.limit(boundedLimit),
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
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  // Reject path characters before using an untrusted ID in a privileged request.
  if (!userId || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(notificationId)) return false;

  const response = await listDocuments(appwriteDatabaseId, appwriteNotificationsCollectionId, [
    Query.equal("$id", [notificationId]),
    Query.equal("user_id", [userId]),
    Query.limit(1),
  ]);
  const notification = response.documents[0];
  if (!notification || notification.$id !== notificationId || notification.user_id !== userId) return false;

  await updateDocument(appwriteDatabaseId, appwriteNotificationsCollectionId, notificationId, { read: true });
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId) throw new Error("Notification owner is required");
  const pageSize = 100;
  let offset = 0;

  while (true) {
    const response = await listDocuments(appwriteDatabaseId, appwriteNotificationsCollectionId, [
      Query.equal("user_id", [userId]),
      Query.orderDesc("created_at"),
      Query.limit(pageSize),
      Query.offset(offset),
    ]);
    const notifications = response.documents as NotificationRecord[];
    await Promise.all(notifications
      .filter((notification) => !notification.read)
      .map((notification) => markNotificationAsRead(notification.$id, userId)));

    if (notifications.length < pageSize) return;
    offset += notifications.length;
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
): Promise<boolean> {
  return createNotification({
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
): Promise<boolean> {
  return createNotification({
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
