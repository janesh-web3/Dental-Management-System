import React, { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSocketIO } from '@/hooks/use-socket';
import { Notification } from '@/types/notification';

/**
 * A component to display toast notifications from socket events
 */
export const ToastNotifications: React.FC = () => {
  const { socket } = useSocketIO();
    useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notification: Notification) => {
      console.log('Toast notification received:', notification);
      
      // Play sound if available
      const audioElement = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audioElement) {
        audioElement.play().catch(err => {
          console.warn('Could not play notification sound:', err);
        });
      }
      
      // Show toast based on notification type
      switch (notification.type) {
        case 'success':
          toast.success(
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm">{notification.description}</p>
            </div>
          );
          break;
        case 'warning':
          toast.warning(
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm">{notification.description}</p>
            </div>
          );
          break;
        case 'error':
          toast.error(
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm">{notification.description}</p>
            </div>
          );
          break;
        default: // 'info'
          toast.info(
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="text-sm">{notification.description}</p>
            </div>
          );
          break;
      }
    };
      // Handle notification sound events
    const handleNotificationSound = (data: any) => {
      console.log('Notification sound event received:', data);
      const audioElement = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audioElement) {
        audioElement.play().catch(err => {
          console.warn('Could not play notification sound:', err);
        });
      }
    };
    
    // Listen for events
    socket.on('notification', handleNotification);
    socket.on('notification:sound', handleNotificationSound);
    
    // Clean up on unmount
    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification:sound', handleNotificationSound);
    };
  }, [socket]);
  
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <audio id="notification-sound" src="/notification-sound.mp3" preload="auto" />
    </>
  );
};

export default ToastNotifications;
