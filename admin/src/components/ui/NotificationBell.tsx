import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Trash2, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { 
    unreadCount, 
    dbNotifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  const [open, setOpen] = useState(false);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (open) {
      fetchNotifications(1, 10);
    }
  }, [open, fetchNotifications]);
  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsRead(id);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(id);
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate if link is provided
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const getTimeLabel = (date: string) => {
    const notifDate = new Date(date);
    const now = new Date();
    
    // If it's today, show relative time (e.g., "2 hours ago")
    if (notifDate.toDateString() === now.toDateString()) {
      return formatDistanceToNow(notifDate, { addSuffix: true });
    }
    
    // Otherwise show formatted date
    return format(notifDate, 'MMM d, yyyy');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {dbNotifications.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <DropdownMenuGroup>
              {dbNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    !notification.isRead && "bg-accent/30"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium">{notification.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleDelete(notification._id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notification.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 self-end">
                    {getTimeLabel(notification.createdAt as string)}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center font-medium"
          onClick={() => {
            navigate('/notifications');
            setOpen(false);
          }}
        >
          View all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
