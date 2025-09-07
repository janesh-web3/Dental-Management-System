import { crudRequest } from "@/lib/api";

export interface PaymentReminderStatus {
  isRunning: boolean;
  nextRun: string | null;
  interval?: string;
  timezone?: string;
  description?: string;
}

export interface PaymentReminderResponse {
  success: boolean;
  message?: string;
  data?: PaymentReminderStatus;
  error?: string;
}

/**
 * Start payment reminder service
 */
export const startPaymentReminders = async (): Promise<PaymentReminderResponse> => {
  return await crudRequest<PaymentReminderResponse>("POST", "/payment-reminders/start");
};

/**
 * Stop payment reminder service
 */
export const stopPaymentReminders = async (): Promise<PaymentReminderResponse> => {
  return await crudRequest<PaymentReminderResponse>("POST", "/payment-reminders/stop");
};

/**
 * Get payment reminder service status
 */
export const getPaymentReminderStatus = async (): Promise<PaymentReminderResponse> => {
  return await crudRequest<PaymentReminderResponse>("GET", "/payment-reminders/status");
};

/**
 * Manually trigger payment reminder check
 */
export const triggerPaymentReminderCheck = async (): Promise<PaymentReminderResponse> => {
  return await crudRequest<PaymentReminderResponse>("POST", "/payment-reminders/trigger");
};

/**
 * Trigger role-specific payment reminders
 */
export const triggerRoleSpecificReminders = async (selectedRoles: string[]): Promise<PaymentReminderResponse> => {
  return await crudRequest<PaymentReminderResponse>("POST", "/payment-reminders/trigger-roles", {
    selectedRoles
  });
};