import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bell, Volume2, Calendar, User, Activity, CreditCard, FileX } from "lucide-react";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import { NavItem } from "@/types";
import { getFeatureNotificationSettings, updateFeatureNotificationSettings } from "@/utils/notificationSettings";
import { saveNotificationPreferences } from "@/utils/doctorNotifications";

interface NotificationPreferences {
  desktopNotifications: boolean;
  soundAlerts: boolean;
  appointmentNotifications: boolean;
  patientNotifications: boolean;
  treatmentNotifications: boolean;
  paymentNotifications: boolean;
  xrayNotifications: boolean;
  doctorNotifications: boolean;
  doctorAddedNotification: boolean;
  doctorUpdatedNotification: boolean;
  doctorDeletedNotification: boolean;
  featureNotifications?: {
    [featureTitle: string]: boolean;
  };
}

interface NotificationSettingsProps {
  userId: string;
  userType: "User" | "Doctor";
  initialPreferences?: NotificationPreferences;
  onSaved?: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({
  userId,
  userType,
  initialPreferences,
  onSaved
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    desktopNotifications: true,
    soundAlerts: true,
    appointmentNotifications: true,
    patientNotifications: true,
    treatmentNotifications: true,
    paymentNotifications: true,
    xrayNotifications: true,
    doctorNotifications: true,
    doctorAddedNotification: true,
    doctorUpdatedNotification: true,
    doctorDeletedNotification: true,
    ...initialPreferences
  });
  
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");
  
  // Check notification permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus("unsupported");
    }
  }, []);
  
  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          toast.success("Notification permission granted!");
          // If permission is granted, enable desktop notifications
          setPreferences(prev => ({
            ...prev,
            desktopNotifications: true
          }));
        } else {
          toast.warning("Notification permission denied. You won't receive desktop notifications.");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        toast.error("Failed to request notification permission");
      }
    }
  };
  
  // Test notification
  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification("Test Notification", {
        body: "This is a test notification from your dental management system",
        icon: "/logo.png"
      });
      
      // Play sound if enabled
      if (preferences.soundAlerts) {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch(error => {
          console.error("Error playing notification sound:", error);
        });
      }
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
      toast.warning("Desktop notifications are not enabled. Please enable them first.");
    }
  };  // Save preferences
  const savePreferences = async () => {
    setSaving(true);
    try {
      const endpoint = userType === "User" 
        ? `/user/notification-preferences/${userId}`
        : `/doctor/notification-preferences/${userId}`;
      
      const response = await crudRequest("PUT", endpoint, { notificationPreferences: preferences });
      
      // Save feature notification settings
      if (preferences.featureNotifications) {
        updateFeatureNotificationSettings(preferences.featureNotifications);
      }
      
      // Save doctor notification settings to localStorage
      saveNotificationPreferences({
        desktopNotifications: preferences.desktopNotifications,
        soundAlerts: preferences.soundAlerts,
        doctorNotifications: preferences.doctorNotifications,
        doctorAddedNotification: preferences.doctorAddedNotification,
        doctorUpdatedNotification: preferences.doctorUpdatedNotification,
        doctorDeletedNotification: preferences.doctorDeletedNotification
      });
      
      if (response) {
        toast.success("Notification preferences saved successfully");
        if (onSaved) {
          onSaved(preferences);
        }
      }
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };
    // Load nav items for feature notifications
  const [navigationItems, setNavigationItems] = useState<NavItem[]>([]);
  
  useEffect(() => {
    // Import nav items
    import('@/constants/data').then(module => {
      setNavigationItems(module.navItems);
      
      // Initialize feature notifications if not set
      if (!preferences.featureNotifications) {
        const featureNotifs = getFeatureNotificationSettings();
        
        setPreferences(prev => ({
          ...prev,
          featureNotifications: featureNotifs
        }));
      }
    });
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Customize how you receive notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">General Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="desktop-notifications" className="flex-1">
                Desktop Notifications
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your desktop
                </p>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={requestPermission}
                >
                  Enable
                </Button>
              )}
              <Switch
                id="desktop-notifications"
                checked={preferences.desktopNotifications}
                onCheckedChange={(checked) => {
                  if (checked && permissionStatus !== 'granted') {
                    requestPermission();
                  } else {
                    setPreferences({ ...preferences, desktopNotifications: checked });
                  }
                }}
                disabled={permissionStatus === 'unsupported' || permissionStatus === 'denied'}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sound-alerts" className="flex-1">
                Sound Alerts
                <p className="text-sm text-muted-foreground">
                  Play sound when notifications arrive
                </p>
              </Label>
            </div>
            <Switch
              id="sound-alerts"
              checked={preferences.soundAlerts}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, soundAlerts: checked })
              }
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          <p className="text-sm text-muted-foreground">
            Select which types of notifications you want to receive
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="appointment-notifications">
                Appointment Notifications
              </Label>
            </div>
            <Switch
              id="appointment-notifications"
              checked={preferences.appointmentNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, appointmentNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="patient-notifications">
                Patient Notifications
              </Label>
            </div>
            <Switch
              id="patient-notifications"
              checked={preferences.patientNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, patientNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="treatment-notifications">
                Treatment Notifications
              </Label>
            </div>
            <Switch
              id="treatment-notifications"
              checked={preferences.treatmentNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, treatmentNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="payment-notifications">
                Payment Notifications
              </Label>
            </div>
            <Switch
              id="payment-notifications"
              checked={preferences.paymentNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, paymentNotifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileX className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="xray-notifications">
                X-Ray Notifications
              </Label>
            </div>
            <Switch
              id="xray-notifications"
              checked={preferences.xrayNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, xrayNotifications: checked })
              }
            />          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Doctor Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Control notifications related to doctor management
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="doctor-notifications">
                Doctor Notifications
              </Label>
            </div>
            <Switch
              id="doctor-notifications"
              checked={preferences.doctorNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, doctorNotifications: checked })
              }
            />
          </div>
          
          {preferences.doctorNotifications && (
            <div className="ml-6 space-y-3 border-l-2 pl-4 border-muted">
              <div className="flex items-center justify-between">
                <Label htmlFor="doctor-added-notifications">
                  Doctor Added Notifications
                </Label>
                <Switch
                  id="doctor-added-notifications"
                  checked={preferences.doctorAddedNotification}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, doctorAddedNotification: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="doctor-updated-notifications">
                  Doctor Updated Notifications
                </Label>
                <Switch
                  id="doctor-updated-notifications"
                  checked={preferences.doctorUpdatedNotification}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, doctorUpdatedNotification: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="doctor-deleted-notifications">
                  Doctor Deleted Notifications
                </Label>
                <Switch
                  id="doctor-deleted-notifications"
                  checked={preferences.doctorDeletedNotification}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, doctorDeletedNotification: checked })
                  }
                />
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Feature-Specific Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Control notifications for each feature in the system
          </p>
          
          {navigationItems.filter(item => !item.disabled && item.title !== "Notifications").map((item) => (
            <div key={item.title} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {item.icon && (
                  <div className="h-4 w-4 text-muted-foreground">
                    {/* We can't directly use the icon from the item, so just show a generic icon */}
                    <Bell className="h-4 w-4" />
                  </div>
                )}
                <Label htmlFor={`feature-${item.title.toLowerCase()}`}>
                  {item.title} Notifications
                </Label>
              </div>
              <Switch
                id={`feature-${item.title.toLowerCase()}`}
                checked={preferences.featureNotifications?.[item.title] ?? true}
                onCheckedChange={(checked) => 
                  setPreferences({
                    ...preferences,
                    featureNotifications: {
                      ...(preferences.featureNotifications || {}),
                      [item.title]: checked
                    }
                  })
                }
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={sendTestNotification}
            disabled={permissionStatus !== 'granted'}
          >
            Test Notification
          </Button>
          <Button
            onClick={savePreferences}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
