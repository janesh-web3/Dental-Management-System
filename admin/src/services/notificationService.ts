import { crudRequest } from "@/lib/api";
import {
  Notification,
  NotificationResponse,
  UnreadCountResponse,
  NotificationMarkReadResponse,
  NotificationMarkAllReadResponse,
  NotificationDeleteResponse,
} from "@/types/notification";
import { ObjectId } from "@/types/global";

/**
 * Get notifications for the current user
 * @param userId User ID
 * @param userType User type (User, Doctor, Patient)
 * @param page Page number
 * @param limit Items per page
 * @param isRead Filter by read status
 * @returns 
 */
export const getNotifications = async (
  userId: ObjectId,
  userType: "User" | "Doctor" | "Patient",
  page: number = 1,
  limit: number = 20,
  isRead?: boolean
): Promise<NotificationResponse> => {
  let url = `/notifications?userId=${userId}&userType=${userType}&page=${page}&limit=${limit}`;
  
  if (isRead !== undefined) {
    url += `&isRead=${isRead}`;
  }
  
  return await crudRequest<NotificationResponse>("GET", url);
};

/**
 * Get the count of unread notifications
 * @param userId User ID
 * @param userType User type (User, Doctor, Patient)
 * @returns 
 */
export const getUnreadCount = async (
  userId: ObjectId,
  userType: "User" | "Doctor" | "Patient"
): Promise<UnreadCountResponse> => {
  return await crudRequest<UnreadCountResponse>(
    "GET",
    `/notifications/unread-count?userId=${userId}&userType=${userType}`
  );
};

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @returns 
 */
export const markAsRead = async (
  notificationId: ObjectId
): Promise<NotificationMarkReadResponse> => {
  return await crudRequest<NotificationMarkReadResponse>(
    "PATCH",
    `/notifications/${notificationId}/read`
  );
};

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @param userType User type (User, Doctor, Patient)
 * @returns 
 */
export const markAllAsRead = async (
  userId: ObjectId,
  userType: "User" | "Doctor" | "Patient"
): Promise<NotificationMarkAllReadResponse> => {
  return await crudRequest<NotificationMarkAllReadResponse>(
    "PATCH",
    `/notifications/mark-all-read`,
    { userId, userType }
  );
};

/**
 * Delete a notification
 * @param notificationId Notification ID
 * @returns 
 */
export const deleteNotification = async (
  notificationId: ObjectId
): Promise<NotificationDeleteResponse> => {
  return await crudRequest<NotificationDeleteResponse>(
    "DELETE",
    `/notifications/${notificationId}`
  );
}; 