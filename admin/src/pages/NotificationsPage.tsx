import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Bell, 
  X, 
  Trash2, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  VolumeX,
  Volume2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { NotificationType, useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    dbNotifications, 
    unreadCount,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    settings,
    updateSettings,
    loading
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Fetch notifications on mount and when page/filter changes
  useEffect(() => {
    fetchNotifications(currentPage, 10);
  }, [fetchNotifications, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    fetchNotifications(1, 10);
    setCurrentPage(1);
  };

  const filteredNotifications = filter === 'all' 
    ? dbNotifications 
    : filter === 'unread'
      ? dbNotifications.filter(n => !n.isRead)
      : dbNotifications.filter(n => n.type === filter);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => handleFilterChange('all')}>
                  All notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('unread')}>
                  Unread
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFilterChange('info')}>
                  <Bell className="h-4 w-4 mr-2 text-blue-500" />
                  Information
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('success')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('warning')}>
                  <Bell className="h-4 w-4 mr-2 text-yellow-500" />
                  Warning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('error')}>
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  Error
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            Clear all
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="bg-background/50">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === 'all' 
                  ? "You don't have any notifications yet." 
                  : filter === 'unread'
                    ? "You don't have any unread notifications."
                    : `You don't have any ${filter} notifications.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification._id}
              className={cn(
                "transition-colors",
                !notification.isRead && "bg-accent/30 border-accent-foreground/20"
              )}
            >
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                    {!notification.isRead && (
                      <Badge variant="secondary" className="ml-2">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification._id)}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification._id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  {format(new Date(notification.createdAt as string), 'PPpp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm">{notification.description}</p>
              </CardContent>
              {notification.link && (
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => {
                      navigate(notification.link || '');
                      if (!notification.isRead) {
                        markAsRead(notification._id);
                      }
                    }}
                  >
                    View details
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {filteredNotifications.length} notifications
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={filteredNotifications.length < 10 || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notifications</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all notifications? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                deleteAllNotifications();
                setDeleteConfirmOpen(false);
              }}
            >
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Customize how you receive notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound when new notifications arrive
                </p>
              </div>
              <Switch 
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications on your desktop
                </p>
              </div>
              <Switch 
                checked={settings.desktopNotifications}
                onCheckedChange={(checked) => updateSettings({ desktopNotifications: checked })}
              />
            </div>
            
            <Tabs defaultValue="all" className="mt-6">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="warning">Warning</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label>All Notifications</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={settings.mutedTypes.length === 0 ? "default" : "outline"}
                      onClick={() => updateSettings({ mutedTypes: [] })}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Enable All
                    </Button>
                    <Button 
                      size="sm" 
                      variant={settings.mutedTypes.includes('info' as NotificationType) &&
                               settings.mutedTypes.includes('success' as NotificationType) &&
                               settings.mutedTypes.includes('warning' as NotificationType) &&
                               settings.mutedTypes.includes('error' as NotificationType) 
                        ? "default" : "outline"}
                      onClick={() => updateSettings({ 
                        mutedTypes: ['info', 'success', 'warning', 'error'] as NotificationType[] 
                      })}
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      Mute All
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Label>Info Notifications</Label>
                  </div>
                  <Switch 
                    checked={!settings.mutedTypes.includes('info' as NotificationType)}
                    onCheckedChange={(checked) => {
                      const newMuted = [...settings.mutedTypes];
                      if (checked) {
                        updateSettings({ 
                          mutedTypes: newMuted.filter(t => t !== 'info') 
                        });
                      } else {
                        if (!newMuted.includes('info' as NotificationType)) {
                          newMuted.push('info' as NotificationType);
                        }
                        updateSettings({ mutedTypes: newMuted });
                      }
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="success" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Label>Success Notifications</Label>
                  </div>
                  <Switch 
                    checked={!settings.mutedTypes.includes('success' as NotificationType)}
                    onCheckedChange={(checked) => {
                      const newMuted = [...settings.mutedTypes];
                      if (checked) {
                        updateSettings({ 
                          mutedTypes: newMuted.filter(t => t !== 'success') 
                        });
                      } else {
                        if (!newMuted.includes('success' as NotificationType)) {
                          newMuted.push('success' as NotificationType);
                        }
                        updateSettings({ mutedTypes: newMuted });
                      }
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="warning" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-yellow-500" />
                    <Label>Warning Notifications</Label>
                  </div>
                  <Switch 
                    checked={!settings.mutedTypes.includes('warning' as NotificationType)}
                    onCheckedChange={(checked) => {
                      const newMuted = [...settings.mutedTypes];
                      if (checked) {
                        updateSettings({ 
                          mutedTypes: newMuted.filter(t => t !== 'warning') 
                        });
                      } else {
                        if (!newMuted.includes('warning' as NotificationType)) {
                          newMuted.push('warning' as NotificationType);
                        }
                        updateSettings({ mutedTypes: newMuted });
                      }
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
