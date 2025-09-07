import { crudRequest } from "@/lib/api";
import {
  Popup,
  PopupFormData,
  PopupResponse,
  PopupsListResponse,
  PopupAnalytics,
  PopupStats,
  PopupFilters
} from "@/types/popup";

/**
 * Create a new popup notification
 */
export const createPopup = async (data: PopupFormData): Promise<PopupResponse> => {
  return await crudRequest<PopupResponse>("POST", "/popups", data);
};

/**
 * Get all popups with paginationaion and filtering (admin only)
 */
export const getAllPopups = async (filters: PopupFilters = {}): Promise<PopupsListResponse> => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters.type) params.append('type', filters.type);
  if (filters.createdBy) params.append('createdBy', filters.createdBy);

  const url = `/popups/all${params.toString() ? '?' + params.toString() : ''}`;
  return await crudRequest<PopupsListResponse>("GET", url);
};

/**
 * Get active popups for the current user
 */
export const getActivePopupsForUser = async (): Promise<{ success: boolean; data: Popup[] }> => {
  return await crudRequest<{ success: boolean; data: Popup[] }>("GET", "/popups/active/user");
};

/**
 * Get a popup by ID
 */
export const getPopupById = async (id: string): Promise<PopupResponse> => {
  return await crudRequest<PopupResponse>("GET", `/popups/${id}`);
};

/**
 * Update a popup
 */
export const updatePopup = async (id: string, data: Partial<PopupFormData>): Promise<PopupResponse> => {
  return await crudRequest<PopupResponse>("PUT", `/popups/${id}`, data);
};

/**
 * Delete a popup
 */
export const deletePopup = async (id: string): Promise<{ success: boolean; message: string }> => {
  return await crudRequest<{ success: boolean; message: string }>("DELETE", `/popups/${id}`);
};

/**
 * Toggle popup active status
 */
export const togglePopupStatus = async (id: string): Promise<{ 
  success: boolean; 
  message: string; 
  data: { isActive: boolean } 
}> => {
  return await crudRequest<{ success: boolean; message: string; data: { isActive: boolean } }>(
    "PATCH", 
    `/popups/${id}/toggle-status`
  );
};

/**
 * Mark popup as viewed
 */
export const markAsViewed = async (id: string): Promise<{ success: boolean; message: string }> => {
  return await crudRequest<{ success: boolean; message: string }>("POST", `/popups/${id}/view`);
};

/**
 * Dismiss popup
 */
export const dismissPopup = async (id: string): Promise<{ success: boolean; message: string }> => {
  return await crudRequest<{ success: boolean; message: string }>("POST", `/popups/${id}/dismiss`);
};

/**
 * Get popup analytics (admin only)
 */
export const getPopupAnalytics = async (id: string): Promise<{ 
  success: boolean; 
  data: PopupAnalytics 
}> => {
  return await crudRequest<{ success: boolean; data: PopupAnalytics }>(
    "GET", 
    `/popups/${id}/analytics`
  );
};

/**
 * Get popup statistics for dashboard
 */
export const getPopupStats = async (): Promise<{ success: boolean; data: PopupStats }> => {
  return await crudRequest<{ success: boolean; data: PopupStats }>("GET", "/popups/stats");
};