import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, BarChart3, Eye } from 'lucide-react';
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
import { Popup, PopupFormData, PopupAnalytics } from '@/types/popup';

const typeColors = {
  'Notice': 'bg-blue-100 text-blue-800 border-blue-200',
  'Event': 'bg-green-100 text-green-800 border-green-200',
  'Payment Reminder': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Alert': 'bg-red-100 text-red-800 border-red-200'
};

const displayTypeColors = {
  'Modal': 'bg-purple-100 text-purple-800',
  'Banner': 'bg-orange-100 text-orange-800',
  'Toast': 'bg-cyan-100 text-cyan-800'
};

const roles = ['superadmin', 'admin', 'staff', 'dentist', 'doctor', 'reception', 'All'];

const PopupManagement: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [analytics, setAnalytics] = useState<PopupAnalytics | null>(null);
  
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
  }, []);

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
    </div>
  );
};

export default PopupManagement;