import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';
import { RefreshCw, AlertCircle, Save, Settings, MessageCircle, CreditCard, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdminContext } from '@/contexts';

interface SMSSettingsData {
  bulkSMS: boolean;
  followupSMS: boolean;
  paymentSMS: boolean;
  autoAppointmentReminder: boolean;
  reminderHoursBeforeAppointment: number;
  dailyLimit: number;
  clinicName: string;
  senderName: string;
  updatedBy?: {
    name: string;
    _id: string;
  };
  updatedAt?: string;
}

const SMSSettings = () => {
  const [settings, setSettings] = useState<SMSSettingsData>({
    bulkSMS: true,
    followupSMS: true,
    paymentSMS: true,
    autoAppointmentReminder: false,
    reminderHoursBeforeAppointment: 24,
    dailyLimit: 500,
    clinicName: 'Dental Clinic',
    senderName: 'Dental Clinic'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{
    availableCredit?: number;
    totalUsed?: number;
    lastUpdated?: string;
    error?: string;
  }>({});
  const [creditLoading, setCreditLoading] = useState(false);
  
  const { adminDetails } = useAdminContext();
  const isSuperAdmin = adminDetails?.role === 'superadmin';
  
  // Fetch SMS settings
  useEffect(() => {
    fetchSettings();
    checkCredit();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{ success: boolean; data: SMSSettingsData }>('GET', '/settings/sms');
      
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast.error('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };
  
  const checkCredit = async () => {
    try {
      setCreditLoading(true);
      const response = await crudRequest<{ 
        success: boolean; 
        availableCredit: number;
        responseCode: number;
      }>('GET', '/sms/credit');
      
      if (response.success) {
        setCreditInfo({
          availableCredit: response.availableCredit,
          lastUpdated: new Date().toISOString()
        });
      } else {
        setCreditInfo({
          error: 'Failed to fetch credit information'
        });
      }
    } catch (error: any) {
      console.error('Error checking SMS credit:', error);
      setCreditInfo({
        error: error.message || 'Failed to fetch credit information'
      });
    } finally {
      setCreditLoading(false);
    }
  };
  
  const saveSettings = async () => {
    if (!isSuperAdmin) {
      toast.error('Only superadmins can update SMS settings');
      return;
    }
    
    try {
      setSaving(true);
      const response = await crudRequest<{ success: boolean; data: SMSSettingsData }>('PUT', '/settings/sms', settings);
      
      if (response.success) {
        toast.success('SMS settings updated successfully');
        setSettings(response.data);
      } else {
        toast.error('Failed to update SMS settings');
      }
    } catch (error) {
      console.error('Error updating SMS settings:', error);
      toast.error('Failed to update SMS settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle toggle changes
  const handleToggleChange = (field: keyof SMSSettingsData) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Handle input changes
  const handleInputChange = (field: keyof SMSSettingsData, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 max-w-5xl"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="mr-2 h-8 w-8" />
            SMS Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your SMS notifications and messaging preferences
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkCredit}
            disabled={creditLoading}
          >
            {creditLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Check Credit
          </Button>
          
          {isSuperAdmin && (
            <Button 
              onClick={saveSettings}
              disabled={saving || loading}
              size="sm"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          )}
        </div>
      </div>
      
      {!isSuperAdmin && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Restricted Access</AlertTitle>
          <AlertDescription>
            Only superadmins can modify SMS settings. You can view the current settings.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credit Information Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              SMS Credit
            </CardTitle>
            <CardDescription>Current SMS credit balance</CardDescription>
          </CardHeader>
          <CardContent>
            {creditInfo.error ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {creditInfo.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl font-bold">
                  {creditInfo.availableCredit !== undefined ? creditInfo.availableCredit.toLocaleString() : '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Available SMS credits
                </div>
                
                {creditInfo.lastUpdated && (
                  <div className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(creditInfo.lastUpdated).toLocaleString()}
                  </div>
                )}
                
                {creditInfo.availableCredit !== undefined && creditInfo.availableCredit < 100 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Low Credit</AlertTitle>
                    <AlertDescription>
                      Your SMS credit is running low. Please recharge soon.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* SMS Feature Settings Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              SMS Features
            </CardTitle>
            <CardDescription>Enable or disable SMS features</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* Bulk SMS Setting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="bulkSMS">Bulk SMS</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow sending SMS to multiple patients at once
                      </p>
                    </div>
                    <Switch
                      id="bulkSMS"
                      checked={settings.bulkSMS}
                      onCheckedChange={() => handleToggleChange('bulkSMS')}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  
                  {/* Follow-up SMS Setting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="followupSMS">Follow-up Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow sending follow-up appointment reminders
                      </p>
                    </div>
                    <Switch
                      id="followupSMS"
                      checked={settings.followupSMS}
                      onCheckedChange={() => handleToggleChange('followupSMS')}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  
                  {/* Payment SMS Setting */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="paymentSMS">Payment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow sending payment due reminders
                      </p>
                    </div>
                    <Switch
                      id="paymentSMS"
                      checked={settings.paymentSMS}
                      onCheckedChange={() => handleToggleChange('paymentSMS')}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                  
                  {/* Auto Appointment Reminder */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoAppointmentReminder">Automatic Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically send reminders before appointments
                      </p>
                    </div>
                    <Switch
                      id="autoAppointmentReminder"
                      checked={settings.autoAppointmentReminder}
                      onCheckedChange={() => handleToggleChange('autoAppointmentReminder')}
                      disabled={!isSuperAdmin}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Additional Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Additional Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reminder Hours */}
                    <div className="space-y-2">
                      <Label htmlFor="reminderHours">Hours Before Appointment</Label>
                      <Input
                        id="reminderHours"
                        type="number"
                        min="1"
                        max="72"
                        value={settings.reminderHoursBeforeAppointment}
                        onChange={(e) => handleInputChange('reminderHoursBeforeAppointment', parseInt(e.target.value))}
                        disabled={!isSuperAdmin || !settings.autoAppointmentReminder}
                      />
                      <p className="text-xs text-muted-foreground">
                        How many hours before an appointment to send a reminder
                      </p>
                    </div>
                    
                    {/* Daily Limit */}
                    <div className="space-y-2">
                      <Label htmlFor="dailyLimit">Daily SMS Limit</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        min="1"
                        value={settings.dailyLimit}
                        onChange={(e) => handleInputChange('dailyLimit', parseInt(e.target.value))}
                        disabled={!isSuperAdmin}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of SMS that can be sent per day
                      </p>
                    </div>
                    
                    {/* Clinic Name */}
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input
                        id="clinicName"
                        value={settings.clinicName}
                        onChange={(e) => handleInputChange('clinicName', e.target.value)}
                        disabled={!isSuperAdmin}
                      />
                      <p className="text-xs text-muted-foreground">
                        Name used in SMS messages
                      </p>
                    </div>
                    
                    {/* Sender Name */}
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Sender Name</Label>
                      <Input
                        id="senderName"
                        value={settings.senderName}
                        onChange={(e) => handleInputChange('senderName', e.target.value)}
                        disabled={!isSuperAdmin}
                      />
                      <p className="text-xs text-muted-foreground">
                        Name shown as sender (if supported by provider)
                      </p>
                    </div>
                  </div>
                </div>
                
                {settings.updatedBy && settings.updatedAt && (
                  <div className="text-xs text-muted-foreground pt-4">
                    Last updated by {settings.updatedBy.name} on {new Date(settings.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default SMSSettings;
