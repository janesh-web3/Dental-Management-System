import React, { useEffect, useState } from 'react';
import { useFeatureNotification } from '@/hooks/useFeatureNotification';
import { Notification } from '@/types/notification';

interface FeatureNotificationFilterProps {
  featureTitle: string;
  notifications: Notification[];
  children: (filteredNotifications: Notification[]) => React.ReactNode;
}

/**
 * Component to filter notifications based on feature notification settings
 * Use this to wrap notification lists or components to respect user preferences
 */
export function FeatureNotificationFilter({
  featureTitle,
  notifications,
  children
}: FeatureNotificationFilterProps) {
  const isNotificationEnabled = useFeatureNotification(featureTitle);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    // If notifications are disabled for this feature, return an empty array
    // Otherwise, return all notifications
    if (!isNotificationEnabled) {
      setFilteredNotifications([]);
    } else {
      setFilteredNotifications(notifications);
    }
  }, [isNotificationEnabled, notifications]);
  
  return <>{children(filteredNotifications)}</>;
}
