import { useState, useEffect } from 'react';
import { getFeatureNotificationSettings } from '@/utils/notificationSettings';

/**
 * Hook to check if notifications are enabled for a specific feature
 * @param featureTitle The title of the feature to check
 * @returns Boolean indicating if notifications are enabled for this feature
 */
export function useFeatureNotification(featureTitle: string): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  
  useEffect(() => {
    const settings = getFeatureNotificationSettings();
    setIsEnabled(settings[featureTitle] ?? true);
    
    // Listen for changes to notification settings
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'featureNotificationSettings') {
        try {
          const newSettings = JSON.parse(e.newValue || '{}');
          setIsEnabled(newSettings[featureTitle] ?? true);
        } catch (error) {
          console.error('Error parsing notification settings', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [featureTitle]);
  
  return isEnabled;
}
