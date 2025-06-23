import { useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Component that initializes the notification system.
 * It should be added near the root of the application.
 */
export function NotificationInitializer() {
  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      // If permission already granted, we're good
      if (Notification.permission === 'granted') {
        // Permission already granted
      } 
      // If permission hasn't been denied, request it
      else if (Notification.permission !== 'denied') {
        // We don't request permission on first load, but we can show a hint
        toast.info(
          "Enable desktop notifications for doctor updates in Settings", 
          { autoClose: 7000 }
        );
      }
    }
    
    // Initialize notification preferences if they don't exist
    if (!localStorage.getItem('notificationPreferences')) {
      // Set default preferences
      const defaultPreferences = {
        desktopNotifications: true,
        soundAlerts: true,
        doctorNotifications: true,
        doctorAddedNotification: true,
        doctorUpdatedNotification: true,
        doctorDeletedNotification: true
      };
      
      localStorage.setItem('notificationPreferences', JSON.stringify(defaultPreferences));
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}
