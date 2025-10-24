import React, { useState } from 'react';
import { FullScreenPopup } from '@/components/ui/enhanced-popup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Users,
  Activity,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const FullScreenPopupDemo: React.FC = () => {
  const [isSystemCheck, setIsSystemCheck] = useState(false);
  const [isNotifications, setIsNotifications] = useState(false);
  const [isSettings, setIsSettings] = useState(false);

  // Demo data
  const systemStatus = {
    database: { status: 'healthy', latency: '12ms' },
    api: { status: 'healthy', response: '45ms' },
    storage: { status: 'warning', usage: '85%' },
    backup: { status: 'healthy', lastRun: '2 hours ago' }
  };

  const notifications = [
    { id: 1, type: 'info', title: 'System Update', message: 'New features available', time: '5 min ago' },
    { id: 2, type: 'warning', title: 'Storage Alert', message: 'Disk usage at 85%', time: '1 hour ago' },
    { id: 3, type: 'success', title: 'Backup Complete', message: 'Daily backup successful', time: '2 hours ago' }
  ];

  const SystemCheckContent = () => (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Latency: {systemStatus.database.latency}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">API Server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Response: {systemStatus.api.response}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">Warning</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Usage: {systemStatus.storage.usage}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Last: {systemStatus.backup.lastRun}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Disk Usage</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Backup completed</span>
                </div>
                <span className="text-xs text-gray-500">2h ago</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">15 users logged in</span>
                </div>
                <span className="text-xs text-gray-500">1h ago</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-amber-50 rounded">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Storage warning</span>
                </div>
                <span className="text-xs text-gray-500">30m ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Recommendation</AlertTitle>
        <AlertDescription>
          Consider cleaning up old files or expanding storage capacity as disk usage has reached 85%.
        </AlertDescription>
      </Alert>
    </div>
  );

  const NotificationsContent = () => (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                notification.type === 'success' ? 'bg-green-100' :
                notification.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle2 className={`h-4 w-4 ${
                    notification.type === 'success' ? 'text-green-600' :
                    notification.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                ) : notification.type === 'warning' ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <Bell className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <Badge variant={notification.type === 'warning' ? 'destructive' : 'default'}>
                    {notification.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const SettingsContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>Configure your system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Auto Backup</span>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <Button variant="outline" size="sm">All</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <Button variant="outline" size="sm">Auto</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>2FA</span>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Session Timeout</span>
              <Button variant="outline" size="sm">30 min</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>Login Alerts</span>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Full Screen Popup Demo</CardTitle>
          <CardDescription>
            Test different full screen popup configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setIsSystemCheck(true)}
              className="flex items-center space-x-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Check Now</span>
            </Button>

            <Button
              onClick={() => setIsNotifications(true)}
              variant="outline"
              className="flex items-center space-x-2"
              size="lg"
            >
              <Bell className="h-4 w-4" />
              <span>View Notifications</span>
            </Button>

            <Button
              onClick={() => setIsSettings(true)}
              variant="outline"
              className="flex items-center space-x-2"
              size="lg"
            >
              <Settings className="h-4 w-4" />
              <span>System Settings</span>
            </Button>
          </div>

          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>Full Screen Popup Features</AlertTitle>
            <AlertDescription>
              • Complete screen takeover • Gradient header • Scrollable content area • Action buttons in footer • Escape key support (when enabled)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* System Check Full Screen Popup */}
      <FullScreenPopup
        isOpen={isSystemCheck}
        onClose={() => setIsSystemCheck(false)}
        title="System Health Check"
        description="Complete system status and performance overview"
        content={<SystemCheckContent />}
        actions={[
          {
            label: 'Refresh',
            variant: 'outline',
            onClick: async () => {
              // Simulate refresh
              await new Promise(resolve => setTimeout(resolve, 1000));
            },
            // icon: <RefreshCw className="h-4 w-4" />, // Removed unsupported property
            // loading: true // Removed unsupported property
          },
          {
            label: 'Close',
            variant: 'default',
            onClick: () => setIsSystemCheck(false)
            // icon: <CheckCircle2 className="h-4 w-4" /> // Removed unsupported property
          }
        ]}
      />

      {/* Notifications Full Screen Popup */}
      <FullScreenPopup
        isOpen={isNotifications}
        onClose={() => setIsNotifications(false)}
        title="System Notifications"
        description="All recent notifications and alerts"
        content={<NotificationsContent />}
        actions={[
          {
            label: 'Mark All Read',
            variant: 'outline',
            onClick: () => console.log('Marking all as read')
            // icon: <CheckCircle2 className="h-4 w-4" /> // Removed unsupported property
          },
          {
            label: 'Close',
            variant: 'default',
            onClick: () => setIsNotifications(false)
          }
        ]}
      />

      {/* Settings Full Screen Popup */}
      <FullScreenPopup
        isOpen={isSettings}
        onClose={() => setIsSettings(false)}
        title="System Settings"
        description="Configure system preferences and security settings"
        content={<SettingsContent />}
        actions={[
          {
            label: 'Save Changes',
            variant: 'default',
            onClick: async () => {
              // Simulate save
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            // icon: <CheckCircle2 className="h-4 w-4" />, // Removed unsupported property
            // loading: true // Removed unsupported property
          },
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: () => setIsSettings(false)
          }
        ]}
      />
    </div>
  );
};