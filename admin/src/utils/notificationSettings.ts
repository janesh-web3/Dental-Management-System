import { navItems } from "@/constants/data";
import { NavItem } from "@/types";

/**
 * Updates the notification settings for each navigation item
 * @param settings Object containing notification enabled state for each feature
 * @returns Updated nav items array
 */
export const updateFeatureNotificationSettings = (settings: Record<string, boolean>): NavItem[] => {
  // Create a copy of the navigation items
  const updatedNavItems = [...navItems];
  
  // Update notification settings for each item
  updatedNavItems.forEach(item => {
    if (settings[item.title] !== undefined) {
      item.notificationEnabled = settings[item.title];
    }
  });
  
  // Save to local storage for persistence
  localStorage.setItem('featureNotificationSettings', JSON.stringify(settings));
  
  return updatedNavItems;
};

/**
 * Retrieves saved notification settings or defaults
 * @returns Object with notification settings for each feature
 */
export const getFeatureNotificationSettings = (): Record<string, boolean> => {
  // Try to get from localStorage
  const savedSettings = localStorage.getItem('featureNotificationSettings');
  
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  
  // Otherwise create default settings based on current navItems
  const defaultSettings: Record<string, boolean> = {};
  navItems.forEach(item => {
    defaultSettings[item.title] = item.notificationEnabled ?? true;
  });
  
  return defaultSettings;
};
