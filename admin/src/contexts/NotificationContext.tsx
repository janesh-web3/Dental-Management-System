import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAdminContext } from './adminContext';
import { useDoctorAuthContext } from './doctorAuthContext';
import { usePatientAuthContext } from './patientAuthContext';
import { toast } from 'react-toastify';
import { socket } from '@/server';

// Types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  _id?: string; // MongoDB ID when fetched from server
  type: NotificationType;
  title: string;
  message: string;
  description?: string; // Alternative to message
  autoClose?: number | false;
  showCloseButton?: boolean;
  isRead?: boolean;
  createdAt?: Date | string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
  sound?: boolean;
}

export interface DBNotification {
  _id: string;
  title: string;
  description: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
}

interface NotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  mutedTypes: NotificationType[];
}

interface NotificationContextType {
  notifications: Notification[]; // In-memory notifications (transient)
  dbNotifications: DBNotification[]; // Fetched from database
  unreadCount: number;
  loading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  playNotificationSound: () => void;
  showDesktopNotification: (title: string, body: string) => void;
}

// Default settings
const defaultSettings: NotificationSettings = {
  soundEnabled: true,
  desktopNotifications: true,
  mutedTypes: []
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URL = socket;

const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dbNotifications, setDbNotifications] = useState<DBNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  // Audio element for notification sound
  const [audioElement] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      return audio;
    }
    return null;
  });
  
  // Get user context and socket
  const { socket, isConnected } = useSocket();
  const { adminDetails } = useAdminContext();
  const { doctorDetails } = useDoctorAuthContext();
  const { patientDetails } = usePatientAuthContext();
  
  // Get user ID and type
  const getUserInfo = useCallback(() => {
    if (adminDetails?._id) {
      return { userId: adminDetails._id, userType: 'User' };
    }
    if (doctorDetails?._id) {
      return { userId: doctorDetails._id, userType: 'Doctor' };
    }
    if (patientDetails?._id) {
      return { userId: patientDetails._id, userType: 'Patient' };
    }
    return { userId: null, userType: null };
  }, [adminDetails, doctorDetails, patientDetails]);
  
  // Helpers
  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled && audioElement) {
      audioElement.play().catch(err => console.error('Error playing notification sound:', err));
    }
  }, [settings.soundEnabled, audioElement]);
  
  const showDesktopNotification = useCallback((title: string, body: string) => {
    if (!settings.desktopNotifications || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }, [settings.desktopNotifications]);
  
  // Add in-memory notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = uuidv4();
    const newNotification = { 
      ...notification, 
      id,
      message: notification.message || notification.description || '' 
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Play sound
    playNotificationSound();
    
    // Show desktop notification
    showDesktopNotification(
      newNotification.title, 
      newNotification.message || newNotification.description || ''
    );

    if (notification.autoClose !== false) {
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, notification.autoClose || 5000);

      return () => clearTimeout(timeout);
    }
  }, [playNotificationSound, showDesktopNotification]);

  // Remove in-memory notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all in-memory notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('notificationSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    const { userId, userType } = getUserInfo();
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let token = '';
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.get(`${API_URL}/api/notifications`, {
        params: { userId, userType, page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDbNotifications(response.data.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [getUserInfo]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const { userId, userType } = getUserInfo();
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    
    try {
      let token = '';
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        params: { userId, userType },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [getUserInfo]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    const { userId, userType } = getUserInfo();
    if (!userId) return;
    
    try {
      let token = '';
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.patch(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDbNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  }, [getUserInfo]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const { userId, userType } = getUserInfo();
    if (!userId) return;
    
    try {
      let token = '';
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.patch(`${API_URL}/api/notifications/mark-all-read`, 
        { userId, userType },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        setDbNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  }, [getUserInfo]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      let token = '';
      const { userType } = getUserInfo();
      
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove from state
        setDbNotifications(prev => prev.filter(notification => notification._id !== id));
        
        // If the deleted notification was unread, update the count
        const deletedNotification = dbNotifications.find(n => n._id === id);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success('Notification deleted');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }, [getUserInfo, dbNotifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    const { userId, userType } = getUserInfo();
    if (!userId) return;
    
    try {
      let token = '';
      if (userType === 'User') {
        token = sessionStorage.getItem('token') || '';
      } else if (userType === 'Doctor') {
        token = sessionStorage.getItem('doctorToken') || '';
      } else if (userType === 'Patient') {
        token = sessionStorage.getItem('patientToken') || '';
      }
      
      const response = await axios.delete(`${API_URL}/api/notifications/delete-all`, {
        data: { userId, userType },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Clear notifications
        setDbNotifications([]);
        setUnreadCount(0);
        
        toast.success('All notifications deleted');
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      toast.error('Failed to delete notifications');
    }
  }, [getUserInfo]);

  // Listen to socket notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: any) => {
      console.log('Received notification via socket:', data);
      
      // Add to in-memory notifications
      addNotification({
        title: data.title,
        message: data.description || data.message || '',
        type: data.type || 'info',
        autoClose: 5000,
        showCloseButton: true,
        isRead: false,
        createdAt: data.createdAt || new Date(),
        link: data.link,
        sourceType: data.sourceType,
        sourceId: data.sourceId
      });
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Refresh the DB notifications list if it's open
      fetchNotifications();
    };

    // Register listeners for all notification types
    socket.on('notification', handleNotification);
    socket.on('patient:added', handleNotification);
    socket.on('appointment:added', handleNotification);
    socket.on('appointment:cancelled', handleNotification);
    socket.on('treatment:updated', handleNotification);
    socket.on('payment:received', handleNotification);
    socket.on('xray:uploaded', handleNotification);

    return () => {
      // Cleanup listeners
      socket.off('notification', handleNotification);
      socket.off('patient:added', handleNotification);
      socket.off('appointment:added', handleNotification);
      socket.off('appointment:cancelled', handleNotification);
      socket.off('treatment:updated', handleNotification);
      socket.off('payment:received', handleNotification);
      socket.off('xray:uploaded', handleNotification);
    };
  }, [socket, isConnected, addNotification, fetchNotifications]);

  // Initial data loading
  useEffect(() => {
    const { userId } = getUserInfo();
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount, getUserInfo]);
  
  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const contextValue = {
    notifications,
    dbNotifications,
    unreadCount,
    loading,
    error,
    addNotification,
    removeNotification,
    clearNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    settings,
    updateSettings,
    playNotificationSound,
    showDesktopNotification
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
