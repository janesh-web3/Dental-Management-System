import { useEffect, useState } from "react";
import { useSocketIO } from "@/hooks/use-socket";
import { useNotification } from "@/hooks/use-notification";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getNotifications, 
  getUnreadCount, 
  markAllAsRead as markAllNotificationsAsRead,
  markAsRead,
  deleteNotification
} from "@/services/notificationService";
import { Notification as NotificationType } from "@/types/notification";
import { useAdminContext } from "@/contexts";
import { format, parseISO } from "date-fns";

export function SocketNotifications() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Get the admin user context
  const { adminDetails } = useAdminContext();
  
  // Use notification hook for listening to socket events
  const { isConnected } = useNotification();
  
  // Get socket instance for personal channel
  const { socket } = useSocketIO();

  // Fetch notifications from the API
  const fetchNotifications = async (pageNum = 1, replace = true) => {
    if (!adminDetails._id) return;
    
    try {
      setLoading(true);
      const response = await getNotifications(
        adminDetails._id,
        "User",
        pageNum,
        10
      );
      
      if (response.success) {
        if (replace) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        setHasMore(response.data.hasNextPage);
        setPage(response.data.currentPage);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count from the API
  const fetchUnreadCount = async () => {
    if (!adminDetails._id) return;
    
    try {
      const response = await getUnreadCount(adminDetails._id, "User");
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!adminDetails._id) return;
    
    try {
      const response = await markAllNotificationsAsRead(adminDetails._id, "User");
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await deleteNotification(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  // Formatting helpers
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Setup personal notification channel based on user ID to refresh notifications
  useEffect(() => {
    if (socket && adminDetails._id) {
      // Listen for personalized notifications
      const personalChannel = `notification:${adminDetails._id}`;
      
      const handlePersonalNotification = () => {
        fetchUnreadCount();
        fetchNotifications(1, true);
      };
      
      socket.on(personalChannel, handlePersonalNotification);
      
      // Listen for various notification types that should refresh the list
      const refreshEvents = [
        'appointment_notification',
        'patient_notification',
        'payment_received',
        'treatment_updated',
        'treatment_plan_added',
        'treatment_plan_updated',
        'xray_uploaded'
      ];
      
      refreshEvents.forEach(event => {
        socket.on(event, handlePersonalNotification);
      });
      
      return () => {
        socket.off(personalChannel, handlePersonalNotification);
        refreshEvents.forEach(event => {
          socket.off(event, handlePersonalNotification);
        });
      };
    }
  }, [socket, adminDetails._id]);

  // Initial fetch
  useEffect(() => {
    if (adminDetails._id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [adminDetails._id]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        
        {!isConnected && (
          <div className="p-4 text-center text-muted-foreground">
            Not connected to notification service
          </div>
        )}
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {loading ? "Loading notifications..." : "No notifications"}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 ${
                    notification.isRead ? "" : "bg-muted/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span
                          className={`text-sm ${
                            notification.isRead ? "text-foreground" : "font-medium"
                          }`}
                        >
                          {notification.title}
                        </span>
                        <Badge
                          variant={
                            notification.type === "info"
                              ? "default"
                              : notification.type === "success"
                              ? "default"
                              : notification.type === "warning"
                              ? "secondary"
                              : "destructive"
                          }
                          className="ml-2 text-[10px]"
                        >
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                        <span>{formatTime(notification.createdAt)}</span>
                        <div className="flex space-x-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={() => handleDeleteNotification(notification._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="p-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 