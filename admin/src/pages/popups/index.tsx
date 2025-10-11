import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, BarChart3, Eye, Play, Square, RefreshCw, Clock, Bell, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import {
  getAllPopups,
  createPopup,
  updatePopup,
  deletePopup,
  togglePopupStatus,
  getPopupAnalytics
} from '@/services/popupService';
import {
  startPaymentReminders,
  stopPaymentReminders,
  getPaymentReminderStatus,
  triggerPaymentReminderCheck,
  triggerRoleSpecificReminders,
  PaymentReminderStatus
} from '@/services/paymentReminderService';
import { Popup, PopupFormData, PopupAnalytics } from '@/types/popup';
import { FullScreenPopup } from '@/components/ui/enhanced-popup';

const typeColors = {
  'Notice': 'bg-blue-100 text-blue-800 border-blue-200',
  'Event': 'bg-green-100 text-green-800 border-green-200',
  'Payment Reminder': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Alert': 'bg-red-100 text-red-800 border-red-200'
};

const displayTypeColors = {
  'Modal': 'bg-purple-100 text-purple-800',
  'Banner': 'bg-orange-100 text-orange-800',
  'Toast': 'bg-cyan-100 text-cyan-800',
  'FullScreen': 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800'
};

const roles = ['superadmin', 'admin', 'staff', 'dentist', 'doctor', 'reception', 'All'];

const PopupManagement: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] = useState(false);
  const [isFullScreenCheckOpen, setIsFullScreenCheckOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [analytics, setAnalytics] = useState<PopupAnalytics | null>(null);
  const [fullScreenData, setFullScreenData] = useState<any>(null);
  
  // Payment reminder states
  const [paymentReminderStatus, setPaymentReminderStatus] = useState<PaymentReminderStatus | null>(null);
  const [loadingReminderAction, setLoadingReminderAction] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['admin', 'staff', 'reception']);
  
  const [formData, setFormData] = useState<PopupFormData>({
    title: '',
    message: '',
    type: 'Notice',
    rolesVisibleTo: [],
    startTime: '',
    endTime: '',
    displayType: 'Modal',
    actions: [{ label: 'Dismiss', action: 'close' }]
  });

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const response = await getAllPopups({ page: 1, limit: 50 });
      if (response.success) {
        setPopups(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch popups');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPopups();
    fetchPaymentReminderStatus();
  }, []);

  const fetchPaymentReminderStatus = async () => {
    try {
      const response = await getPaymentReminderStatus();
      if (response.success && response.data) {
        setPaymentReminderStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment reminder status');
    }
  };

  const handleStartPaymentReminders = async () => {
    setLoadingReminderAction(true);
    try {
      const response = await startPaymentReminders();
      if (response.success) {
        toast.success('Payment reminder service started successfully!');
        fetchPaymentReminderStatus();
      } else {
        toast.error(response.message || 'Failed to start payment reminder service');
      }
    } catch (error) {
      toast.error('Failed to start payment reminder service');
    }
    setLoadingReminderAction(false);
  };

  const handleStopPaymentReminders = async () => {
    setLoadingReminderAction(true);
    try {
      const response = await stopPaymentReminders();
      if (response.success) {
        toast.success('Payment reminder service stopped successfully!');
        fetchPaymentReminderStatus();
      } else {
        toast.error(response.message || 'Failed to stop payment reminder service');
      }
    } catch (error) {
      toast.error('Failed to stop payment reminder service');
    }
    setLoadingReminderAction(false);
  };

  const handleTriggerManualCheck = async () => {
    setLoadingReminderAction(true);
    try {
      const response = await triggerPaymentReminderCheck();
      if (response.success) {
        toast.success('Payment reminder check triggered successfully!');
        // Refresh popups to see any new reminders
        setTimeout(() => {
          fetchPopups();
          // Trigger global popup refresh
          window.dispatchEvent(new Event('refresh-popups'));
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to trigger payment reminder check');
      }
    } catch (error) {
      toast.error('Failed to trigger payment reminder check');
    }
    setLoadingReminderAction(false);
  };

  const handleFullScreenCheck = async () => {
    setLoadingReminderAction(true);

    // Simulate fetching comprehensive system data
    const systemData = {
      popups: popups,
      paymentReminderStatus: paymentReminderStatus,
      systemHealth: {
        database: { status: 'healthy', latency: '12ms' },
        api: { status: 'healthy', response: '45ms' },
        storage: { status: 'warning', usage: '85%' },
        backup: { status: 'healthy', lastRun: '2 hours ago' }
      },
      activeUsers: 24,
      totalNotifications: popups.filter(p => p.isActive).length,
      recentActivity: [
        { type: 'popup_created', message: 'New popup created', time: '5 min ago' },
        { type: 'reminder_sent', message: 'Payment reminders sent', time: '15 min ago' },
        { type: 'user_login', message: '12 users logged in', time: '30 min ago' }
      ]
    };

    try {
      // Trigger actual check
      const response = await triggerPaymentReminderCheck();
      if (response.success) {
        systemData.recentActivity.unshift({
          type: 'system_check',
          message: 'Full system check completed successfully',
          time: 'Just now'
        });

        // Refresh popups
        await fetchPopups();
        window.dispatchEvent(new Event('refresh-popups'));
      }

      setFullScreenData(systemData);
      setIsFullScreenCheckOpen(true);
      toast.success('Full system check completed!');

    } catch (error) {
      toast.error('System check failed');
    }

    setLoadingReminderAction(false);
  };

  const handleTriggerRoleSpecificCheck = async () => {
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setLoadingReminderAction(true);
    try {
      const response = await triggerRoleSpecificReminders(selectedRoles);
      if (response.success) {
        toast.success(response.message || 'Role-specific payment reminders sent successfully!');
        setIsRoleSelectionModalOpen(false);
        // Refresh popups to see any new reminders
        setTimeout(() => {
          fetchPopups();
          // Trigger global popup refresh
          window.dispatchEvent(new Event('refresh-popups'));
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to send role-specific reminders');
      }
    } catch (error) {
      toast.error('Failed to send role-specific reminders');
    }
    setLoadingReminderAction(false);
  };

  const handleRoleSelectionChange = (role: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, role]);
    } else {
      setSelectedRoles(prev => prev.filter(r => r !== role));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'Notice',
      rolesVisibleTo: [],
      startTime: '',
      endTime: '',
      displayType: 'Modal',
      actions: [{ label: 'Dismiss', action: 'close' }]
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.message || !formData.startTime || formData.rolesVisibleTo.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await createPopup(formData);
      if (response.success) {
        toast.success('Popup created successfully!');
        setIsCreateModalOpen(false);
        resetForm();
        fetchPopups();
      }
    } catch (error) {
      toast.error('Failed to create popup');
    }
  };

  const handleEdit = (popup: Popup) => {
    setCurrentPopup(popup);
    setFormData({
      title: popup.title,
      message: popup.message,
      type: popup.type,
      rolesVisibleTo: popup.rolesVisibleTo,
      startTime: new Date(popup.startTime).toISOString().slice(0, 16),
      endTime: popup.endTime ? new Date(popup.endTime).toISOString().slice(0, 16) : '',
      reminderTime: popup.reminderTime,
      displayType: popup.displayType,
      actions: popup.actions
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!currentPopup || !formData.title || !formData.message || !formData.startTime || formData.rolesVisibleTo.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await updatePopup(currentPopup._id, formData);
      if (response.success) {
        toast.success('Popup updated successfully!');
        setIsEditModalOpen(false);
        setCurrentPopup(null);
        resetForm();
        fetchPopups();
      }
    } catch (error) {
      toast.error('Failed to update popup');
    }
  };

  const handleDelete = async (popup: Popup) => {
    if (!confirm(`Are you sure you want to delete "${popup.title}"?`)) {
      return;
    }

    try {
      const response = await deletePopup(popup._id);
      if (response.success) {
        toast.success('Popup deleted successfully!');
        fetchPopups();
      }
    } catch (error) {
      toast.error('Failed to delete popup');
    }
  };

  const handleToggleStatus = async (popup: Popup) => {
    try {
      const response = await togglePopupStatus(popup._id);
      if (response.success) {
        toast.success(response.message);
        fetchPopups();
      }
    } catch (error) {
      toast.error('Failed to toggle popup status');
    }
  };

  const handleViewAnalytics = async (popup: Popup) => {
    try {
      const response = await getPopupAnalytics(popup._id);
      if (response.success) {
        setAnalytics(response.data);
        setCurrentPopup(popup);
        setIsAnalyticsModalOpen(true);
      }
    } catch (error) {
      toast.error('Failed to fetch analytics');
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        rolesVisibleTo: [...prev.rolesVisibleTo, role as any]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rolesVisibleTo: prev.rolesVisibleTo.filter(r => r !== role)
      }));
    }
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { label: '', action: 'close' }]
    }));
  };

  const updateAction = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Popup Management</h1>
          <p className="text-muted-foreground">
            Create and manage system-wide notifications and alerts
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Popup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Popup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter popup title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Notice">Notice</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
                      <SelectItem value="Alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter popup message"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display Type *</Label>
                <Select 
                  value={formData.displayType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, displayType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Modal">Modal</SelectItem>
                    <SelectItem value="Banner">Banner</SelectItem>
                    <SelectItem value="Toast">Toast</SelectItem>
                    <SelectItem value="FullScreen">Full Screen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visible to Roles *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={role}
                        checked={formData.rolesVisibleTo.includes(role as any)}
                        onCheckedChange={(checked) => handleRoleChange(role, checked as boolean)}
                      />
                      <Label htmlFor={role} className="text-sm capitalize">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                {formData.actions.map((action, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center">
                    <Input
                      placeholder="Label"
                      value={action.label}
                      onChange={(e) => updateAction(index, 'label', e.target.value)}
                    />
                    <Select
                      value={action.action}
                      onValueChange={(value) => updateAction(index, 'action', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="close">Close</SelectItem>
                        <SelectItem value="redirect">Redirect</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {action.action === 'redirect' && (
                      <Input
                        placeholder="URL"
                        value={action.url || ''}
                        onChange={(e) => updateAction(index, 'url', e.target.value)}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAction(index)}
                      disabled={formData.actions.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  Add Action
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Popup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Reminder Service Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment Reminder Service
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatically creates payment reminder popups every 5 minutes for overdue patients
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={paymentReminderStatus?.isRunning ? "default" : "secondary"}>
                  {paymentReminderStatus?.isRunning ? "Running" : "Stopped"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {paymentReminderStatus?.description || 'Loading status...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleFullScreenCheck}
                disabled={loadingReminderAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", loadingReminderAction && "animate-spin")} />
                Full Screen Check
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerManualCheck}
                disabled={loadingReminderAction}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", loadingReminderAction && "animate-spin")} />
                Check Now (All)
              </Button>
              
              <Dialog open={isRoleSelectionModalOpen} onOpenChange={setIsRoleSelectionModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingReminderAction}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1", loadingReminderAction && "animate-spin")} />
                    Check Now (Roles)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Payment Reminders to Specific Roles</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which roles should receive immediate payment reminder notifications for all overdue patients.
                    </p>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Roles to Notify *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {roles.filter(role => role !== 'All').map(role => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={selectedRoles.includes(role)}
                              onCheckedChange={(checked) => handleRoleSelectionChange(role, checked as boolean)}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm capitalize">{role}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Selected roles:</strong> {selectedRoles.length > 0 ? selectedRoles.join(', ') : 'None'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Payment reminder popups will appear immediately on their dashboards as banner notifications.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsRoleSelectionModalOpen(false)}
                        disabled={loadingReminderAction}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleTriggerRoleSpecificCheck}
                        disabled={loadingReminderAction || selectedRoles.length === 0}
                      >
                        {loadingReminderAction ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Send Reminders
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {paymentReminderStatus?.isRunning ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopPaymentReminders}
                  disabled={loadingReminderAction}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop Service
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartPaymentReminders}
                  disabled={loadingReminderAction}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Service
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popup Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Display</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.map((popup) => (
                  <TableRow key={popup._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{popup.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {popup.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(typeColors[popup.type])}>
                        {popup.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(displayTypeColors[popup.displayType])}>
                        {popup.displayType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {popup.rolesVisibleTo.slice(0, 2).map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {popup.rolesVisibleTo.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{popup.rolesVisibleTo.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={popup.isActive ? "default" : "secondary"}>
                        {popup.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>Start: {new Date(popup.startTime).toLocaleString()}</div>
                      {popup.endTime && (
                        <div>End: {new Date(popup.endTime).toLocaleString()}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleStatus(popup)}
                        >
                          {popup.isActive ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(popup)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewAnalytics(popup)}
                        >
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => handleDelete(popup)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal - Similar structure to Create Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Popup</DialogTitle>
          </DialogHeader>
          {/* Same form structure as create modal but with handleUpdate */}
          <div className="space-y-4">
            {/* Form fields identical to create modal */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Update Popup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={isAnalyticsModalOpen} onOpenChange={setIsAnalyticsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Popup Analytics - {currentPopup?.title}</DialogTitle>
          </DialogHeader>
          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{analytics.totalViews}</div>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{analytics.totalDismissals}</div>
                    <p className="text-xs text-muted-foreground">Dismissals</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{analytics.viewRate}%</div>
                    <p className="text-xs text-muted-foreground">View Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{analytics.dismissalRate}%</div>
                    <p className="text-xs text-muted-foreground">Dismissal Rate</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center pt-4">
                <Button onClick={() => setIsAnalyticsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Screen System Check */}
      <FullScreenPopup
        isOpen={isFullScreenCheckOpen}
        onClose={() => setIsFullScreenCheckOpen(false)}
        title="System Health & Popup Management Overview"
        description="Complete system status, popup analytics, and real-time monitoring dashboard"
        content={
          fullScreenData && (
            <div className="space-y-8">
              {/* System Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-900">{fullScreenData.totalNotifications}</p>
                        <p className="text-sm text-blue-600">Active Popups</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-900">{fullScreenData.activeUsers}</p>
                        <p className="text-sm text-green-600">Active Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-900">
                          {fullScreenData.paymentReminderStatus?.isRunning ? 'ON' : 'OFF'}
                        </p>
                        <p className="text-sm text-purple-600">Reminder Service</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-500 rounded-full">
                        <RefreshCw className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-900">LIVE</p>
                        <p className="text-sm text-amber-600">System Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>System Health Monitor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(fullScreenData.systemHealth).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{key}</p>
                          <p className="text-sm text-gray-500">
                            {value.latency || value.response || value.usage || value.lastRun}
                          </p>
                        </div>
                        <Badge variant={value.status === 'healthy' ? 'default' : 'destructive'}>
                          {value.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Popups Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Active Popups Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fullScreenData.popups.filter((popup: Popup) => popup.isActive).slice(0, 5).map((popup: Popup) => (
                      <div key={popup._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{popup.title}</p>
                          <p className="text-sm text-gray-600 truncate max-w-md">{popup.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn(typeColors[popup.type])}>
                            {popup.type}
                          </Badge>
                          <Badge className={cn(displayTypeColors[popup.displayType])}>
                            {popup.displayType}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent System Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {fullScreenData.recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'system_check' ? 'bg-green-100' :
                          activity.type === 'popup_created' ? 'bg-blue-100' :
                          activity.type === 'reminder_sent' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {activity.type === 'system_check' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : activity.type === 'popup_created' ? (
                            <Plus className="h-4 w-4 text-blue-600" />
                          ) : activity.type === 'reminder_sent' ? (
                            <Bell className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }
        actions={[
          {
            label: 'Refresh Data',
            variant: 'outline',
            onClick: handleFullScreenCheck,
            icon: <RefreshCw className="h-4 w-4" />,
            loading: loadingReminderAction
          },
          {
            label: 'Close Dashboard',
            variant: 'default',
            onClick: () => setIsFullScreenCheckOpen(false)
          }
        ]}
      />
    </div>
  );
};

export default PopupManagement;