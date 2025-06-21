import React, { useEffect } from 'react';
import { ToastClose } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Watch for new notifications and show toast
    notifications.forEach((notification) => {      
      // Create toast for this notification
      toast({
        title: notification.title,
        description: notification.message || notification.description,
        variant: notification.type === 'error' ? 'destructive' : 'default',
        action: notification.showCloseButton ? (
          <ToastClose onClick={() => removeNotification(notification.id)} />
        ) : undefined,
        duration: notification.autoClose === false ? Infinity : notification.autoClose || 5000,
      });
      
      // Remove the notification from context after showing toast
      removeNotification(notification.id);
    });
  }, [notifications, removeNotification, toast]);

  return null; // The toast component handles UI rendering
};

export default NotificationToast;
