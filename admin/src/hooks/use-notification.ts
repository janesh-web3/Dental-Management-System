import { useSocketIO } from './use-socket';
import { ObjectId } from '@/types/global';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface SendNotificationParams {
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  receiver?: ObjectId;
  receiverModel?: 'User' | 'Doctor' | 'Patient';
  targetRoles?: string[];
  createdBy?: ObjectId;
  createdByModel?: 'User' | 'Doctor' | 'System';
  additionalData?: Record<string, any>;
  saveToDatabase?: boolean;
}

interface NotificationPayload {
  _id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  receiver: ObjectId;
  additionalData?: Record<string, any>;
}

/**
 * Hook to send notifications via Socket.IO and listen to notifications
 */
export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const { emit, isConnected, socket, subscribe, unsubscribe, userRole } = useSocketIO();

  // Listen for all notification types
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Create event handlers for various notification types
    const handleNotification = (data: NotificationPayload) => {
      try {
        // Validate notification data
        if (!data.title) {
          console.warn('Received notification without title:', data);
          return;
        }

        // Add to notification state
        setNotifications(prev => [data, ...prev]);
        
        // Show toast based on notification type
        switch (data.type) {
          case 'info':
            toast.info(data.title, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            break;
          case 'success':
            toast.success(data.title, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            break;
          case 'warning':
            toast.warning(data.title, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            break;
          case 'error':
            toast.error(data.title, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
            break;
          default:
            toast.info(data.title, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    };

    // Subscribe to all notification channels
    subscribe('notification', handleNotification);
    subscribe('appointment_notification', handleNotification);
    subscribe('patient_notification', handleNotification);
    subscribe('payment_received', handleNotification);
    subscribe('treatment_updated', handleNotification);
    subscribe('treatment_plan_added', handleNotification);
    subscribe('treatment_plan_updated', handleNotification);
    subscribe('xray_uploaded', handleNotification);

    // Cleanup
    return () => {
      unsubscribe('notification', handleNotification);
      unsubscribe('appointment_notification', handleNotification);
      unsubscribe('patient_notification', handleNotification);
      unsubscribe('payment_received', handleNotification);
      unsubscribe('treatment_updated', handleNotification);
      unsubscribe('treatment_plan_added', handleNotification);
      unsubscribe('treatment_plan_updated', handleNotification);
      unsubscribe('xray_uploaded', handleNotification);
    };
  }, [socket, isConnected, subscribe, unsubscribe]);

  /**
   * Send a notification to a specific user or role
   */
  const sendNotification = (params: SendNotificationParams): boolean => {
    if (!isConnected) {
      console.warn('Socket not connected, notification could not be sent');
      toast.error('Unable to send notification: Not connected to server');
      return false;
    }

    try {
      // Validate required fields
      if (!params.title) {
        console.warn('Cannot send notification: Title is required');
        return false;
      }

      if (!params.receiver && (!params.targetRoles || params.targetRoles.length === 0)) {
        console.warn('Cannot send notification: Either receiver or targetRoles must be specified');
        return false;
      }

      // Check if we're sending to specific roles or a specific user
      if (params.targetRoles && params.targetRoles.length > 0) {
        // Send to specific roles
        emit('send_notification', {
          title: params.title,
          description: params.description || '',
          type: params.type || 'info',
          targetRoles: params.targetRoles,
          createdBy: params.createdBy || '000000000000000000000000',
          createdByModel: params.createdByModel || 'System',
          additionalData: params.additionalData || {},
          saveToDatabase: params.saveToDatabase !== false
        });
      } else if (params.receiver) {
        // Send to specific user
        emit('send_notification', {
          title: params.title,
          description: params.description || '',
          type: params.type || 'info',
          receiver: params.receiver,
          receiverModel: params.receiverModel || 'User',
          createdBy: params.createdBy || '000000000000000000000000',
          createdByModel: params.createdByModel || 'System',
          additionalData: params.additionalData || {},
        });
      } else {
        console.warn('No receiver or targetRoles specified for notification');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
      return false;
    }
  };

  /**
   * Clear all notifications from local state
   */
  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    sendNotification,
    isConnected,
    notifications,
    clearNotifications,
    userRole
  };
};

export default useNotification;