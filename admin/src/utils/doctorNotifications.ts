import { toast } from "react-toastify";

interface NotificationOptions {
  title?: string;
  body: string;
  icon?: string;
  onClick?: () => void;
}

// Get notification preferences from localStorage
const getNotificationPreferences = () => {
  try {
    const preferences = localStorage.getItem('notificationPreferences');
    if (preferences) {
      return JSON.parse(preferences);
    }
  } catch (error) {
    console.error('Error getting notification preferences:', error);
  }
  
  // Default preferences if none are found
  return {
    desktopNotifications: true,
    soundAlerts: true,
    doctorNotifications: true,
    doctorAddedNotification: true,
    doctorUpdatedNotification: true,
    doctorDeletedNotification: true
  };
};

// Save notification preferences to localStorage
export const saveNotificationPreferences = (preferences: any) => {
  localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
};

// Check if desktop notifications are allowed
const areDesktopNotificationsAllowed = () => {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    getNotificationPreferences().desktopNotifications
  );
};

// Play notification sound if enabled
const playNotificationSound = () => {
  if (getNotificationPreferences().soundAlerts) {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }
};

// Show a desktop notification
export const showDesktopNotification = (options: NotificationOptions) => {
  if (!areDesktopNotificationsAllowed()) {
    // Fall back to toast notification if desktop notifications are not allowed
    toast.info(options.body);
    return;
  }
  
  try {
    const notification = new Notification(options.title || 'Dental Management System', {
      body: options.body,
      icon: options.icon || '/logo.png'
    });
    
    // Play sound if enabled
    playNotificationSound();
    
    // Set click handler
    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        notification.close();
        options.onClick?.();
      };
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  } catch (error) {
    console.error('Error showing desktop notification:', error);
    toast.info(options.body);
  }
};

// Check if doctor notifications are enabled
const areDoctorNotificationsEnabled = () => {
  const prefs = getNotificationPreferences();
  return prefs.doctorNotifications;
};

// Doctor added notification
export const showDoctorAddedNotification = (doctorName: string) => {
  const prefs = getNotificationPreferences();
  if (!areDoctorNotificationsEnabled() || !prefs.doctorAddedNotification) {
    return;
  }
  
  showDesktopNotification({
    title: 'Doctor Added',
    body: `${doctorName} has been added to the system.`,
    onClick: () => {
      // Navigate to doctors page if needed
      window.location.href = '/doctors';
    }
  });
};

// Doctor updated notification
export const showDoctorUpdatedNotification = (doctorName: string) => {
  const prefs = getNotificationPreferences();
  if (!areDoctorNotificationsEnabled() || !prefs.doctorUpdatedNotification) {
    return;
  }
  
  showDesktopNotification({
    title: 'Doctor Updated',
    body: `${doctorName}'s information has been updated.`,
    onClick: () => {
      // Navigate to doctors page if needed
      window.location.href = '/doctors';
    }
  });
};

// Doctor deleted notification
export const showDoctorDeletedNotification = (doctorName: string) => {
  const prefs = getNotificationPreferences();
  if (!areDoctorNotificationsEnabled() || !prefs.doctorDeletedNotification) {
    return;
  }
  
  showDesktopNotification({
    title: 'Doctor Deleted',
    body: `${doctorName} has been removed from the system.`,
    onClick: () => {
      // Navigate to doctors page if needed
      window.location.href = '/doctors';
    }
  });
};
