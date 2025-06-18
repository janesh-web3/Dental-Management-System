import { ObjectId } from "./global";

export interface Notification {
  _id: ObjectId;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  receiver: ObjectId;
  receiverModel: "User" | "Doctor" | "Patient";
  createdBy: ObjectId;
  createdByModel: "User" | "Doctor" | "System";
  additionalData?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface NotificationCreateResponse {
  success: boolean;
  data: Notification;
}

export interface NotificationMarkReadResponse {
  success: boolean;
  data: Notification;
}

export interface NotificationMarkAllReadResponse {
  success: boolean;
  message: string;
  modifiedCount: number;
}

export interface NotificationDeleteResponse {
  success: boolean;
  message: string;
} 