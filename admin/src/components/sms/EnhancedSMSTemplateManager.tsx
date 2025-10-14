import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Search,
  Filter,
  X,
  Copy,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other' | 'Payment Due' | 'Missed Visit' | 'Birthday Wish' | 'Feedback Request';
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  isAutoTriggered?: boolean;
  triggerEvent?: 'appointment_booking' | 'appointment_cancellation' | 'missed_visit' | 'payment_due' | 'birthday' | 'feedback_request' | 'follow_up';
  isActive?: boolean;
  lastUsed?: string;
  totalSent?: number;
}

const TEMPLATE_CATEGORIES = [
  'Appointment',
  'Reminder',
  'Promotion',
  'General',
  'Other',
  'Payment Due',
  'Missed Visit',
  'Birthday Wish',
  'Feedback Request'
];

// Removed COMMON_VARIABLES array as placeholders are no longer supported

export const EnhancedSMSTemplateManager: React.FC = () => {
  // Define the placeholder warning message to avoid JSX interpretation issues
  const placeholderWarningMessage = "Plain SMS Mode Active – Messages will be sent exactly as written. Placeholders like {{patientName}}, {{appointmentDate}}, etc. are not supported and will be removed automatically.";
  
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'General' as 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other' | 'Payment Due' | 'Missed Visit' | 'Birthday Wish' | 'Feedback Request',
    variables: [] as string[],
    isAutoTriggered: false,
    triggerEvent: '' as 'appointment_booking' | 'appointment_cancellation' | 'missed_visit' | 'payment_due' | 'birthday' | 'feedback_request' | 'follow_up' | '',
    isActive: true
  });

  const [previewData, setPreviewData] = useState({
    patientName: 'John Doe',
    clinicName: 'Dental Clinic',
    doctorName: 'Dr. Smith',
    appointmentDate: '2024-01-15',
    appointmentTime: '2:00 PM',
    amount: '5000',
    dueDate: '2024-01-20',
    contactNumber: '9876543210',
    treatmentType: 'Root Canal',
    followUpDate: '2024-01-22'
  });

  // State for validation errors
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<any>('GET', '/sms/templates');
      // Handle different possible response structures
      let templatesData: SMSTemplate[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        templatesData = response;
      } else if (response?.templates && Array.isArray(response.templates)) {
        // { templates: SMSTemplate[] } structure
        templatesData = response.templates;
      } else if (response?.data && Array.isArray(response.data)) {
        // { data: SMSTemplate[] } structure
        templatesData = response.data;
      }
      
      // Defensive check to ensure templates have required properties
      const validTemplates = templatesData.filter(template => template && template._id && template.name);
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch SMS templates');
      // Set templates to empty array on error
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    // Defensive check to ensure template is properly defined
    if (!template || !template.name || !template.content) {
      return false;
    }
    
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to check for placeholders in message content
  const checkForPlaceholders = (content: string): boolean => {
    const placeholderRegex = /\{\{.*?\}\}/g;
    return placeholderRegex.test(content);
  };

  // Removed extractVariables function as placeholders are no longer supported

  // Removed insertVariable function as placeholders are no longer supported

  const handleContentChange = (content: string) => {
    // Check for placeholders and set validation error if found
    if (checkForPlaceholders(content)) {
      setValidationError('Plain SMS Mode Active - Placeholders are not allowed. Please remove all placeholders ({{...}}) from the message.');
    } else {
      setValidationError('');
    }
    
    setFormData(prev => ({
      ...prev,
      content,
      variables: [] // Clear variables as they're not supported
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      category: 'General' as 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other' | 'Payment Due' | 'Missed Visit' | 'Birthday Wish' | 'Feedback Request',
      variables: [],
      isAutoTriggered: false,
      triggerEvent: '',
      isActive: true
    });
    setValidationError('');
  };

  const handleCreate = async () => {
    // Check for placeholders before creating
    if (checkForPlaceholders(formData.content)) {
      toast.error('Placeholders are not allowed in Plain SMS Mode. Please remove all placeholders ({{...}}) from the message.');
      return;
    }

    try {
      // Only send auto-trigger fields if isAutoTriggered is true
      const requestData = {
        ...formData,
        variables: [], // Ensure variables are empty
        triggerEvent: formData.isAutoTriggered && formData.triggerEvent ? formData.triggerEvent : undefined
      };
      
      const response = await crudRequest<any>('POST', '/sms/templates', requestData);
      // Handle different possible response structures
      let newTemplate: SMSTemplate | null = null;
      
      if (response?.template) {
        // { template: SMSTemplate } structure
        newTemplate = response.template;
      } else if (response?.data) {
        // { data: SMSTemplate } structure
        newTemplate = response.data;
      } else if (response?._id) {
        // Direct template object
        newTemplate = response;
      }
      
      // Defensive check to ensure newTemplate is properly defined
      if (newTemplate && newTemplate._id) {
        setTemplates(prev => [newTemplate as SMSTemplate, ...prev]);
      }
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('SMS template created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    // Check for placeholders before updating
    if (checkForPlaceholders(formData.content)) {
      toast.error('Placeholders are not allowed in Plain SMS Mode. Please remove all placeholders ({{...}}) from the message.');
      return;
    }

    try {
      // Only send auto-trigger fields if isAutoTriggered is true
      const requestData = {
        ...formData,
        variables: [], // Ensure variables are empty
        triggerEvent: formData.isAutoTriggered && formData.triggerEvent ? formData.triggerEvent : undefined
      };
      
      const response = await crudRequest<any>('PUT', `/sms/templates/${selectedTemplate._id}`, requestData);
      // Handle different possible response structures
      let updatedTemplate: SMSTemplate | null = null;
      
      if (response?.template) {
        // { template: SMSTemplate } structure
        updatedTemplate = response.template;
      } else if (response?.data) {
        // { data: SMSTemplate } structure
        updatedTemplate = response.data;
      } else if (response?._id) {
        // Direct template object
        updatedTemplate = response;
      }
      
      // Defensive check to ensure updatedTemplate is properly defined
      if (updatedTemplate && updatedTemplate._id) {
        setTemplates(prev => prev.map(t => t._id === selectedTemplate._id ? updatedTemplate as SMSTemplate : t));
      }
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
      toast.success('SMS template updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update template');
    }
  };

  const handleDelete = async (template: SMSTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) return;

    try {
      await crudRequest('DELETE', `/sms/templates/${template._id}`);
      setTemplates(prev => prev.filter(t => t._id !== template._id));
      toast.success('SMS template deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleDuplicate = (template: SMSTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      content: template.content,
      category: template.category,
      variables: [],
      isAutoTriggered: template.isAutoTriggered || false,
      triggerEvent: template.triggerEvent || '',
      isActive: template.isActive !== undefined ? template.isActive : true
    });
    setIsCreateDialogOpen(true);
  };

  const renderPreview = () => {
    if (!selectedTemplate) return '';

    // In Plain SMS Mode, we show the message exactly as it is without any replacements
    return selectedTemplate.content;
  };

  const exportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `sms-templates-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Templates</h1>
          <p className="text-muted-foreground">
            Manage and organize your SMS templates for bulk messaging
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTemplates}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Info banner for Plain SMS Mode */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{placeholderWarningMessage}</strong>
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TEMPLATE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No templates found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.isAutoTriggered && (
                          <Badge variant="default" className="w-fit">
                            Auto: {template.triggerEvent}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{template.createdBy.name}</span>
                        {template.lastUsed && (
                          <span className="text-xs text-muted-foreground">
                            Last used: {new Date(template.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                        {template.totalSent !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            Sent: {template.totalSent}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {template.isActive !== false ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setFormData({
                              name: template.name,
                              content: template.content,
                              category: template.category,
                              variables: [],
                              isAutoTriggered: template.isAutoTriggered || false,
                              triggerEvent: template.triggerEvent || '',
                              isActive: template.isActive !== undefined ? template.isActive : true
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create SMS Template</DialogTitle>
            <DialogDescription>
              Create a new plain SMS template without variables or placeholders
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other') => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your plain SMS message..."
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.content.length} characters ({Math.ceil(formData.content.length / 160)} SMS units)
                </p>
                {validationError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {validationError}
                  </p>
                )}
              </div>
              
              {/* Auto-trigger section */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoTrigger"
                    checked={formData.isAutoTriggered}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAutoTriggered: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="autoTrigger">Enable Auto-trigger</Label>
                </div>
                
                {formData.isAutoTriggered && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="triggerEvent">Trigger Event</Label>
                      <Select 
                        value={formData.triggerEvent} 
                        onValueChange={(value: 'appointment_booking' | 'appointment_cancellation' | 'missed_visit' | 'payment_due' | 'birthday' | 'feedback_request' | 'follow_up' | '') => 
                          setFormData(prev => ({ ...prev, triggerEvent: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment_booking">Appointment Booking</SelectItem>
                          <SelectItem value="appointment_cancellation">Appointment Cancellation</SelectItem>
                          <SelectItem value="missed_visit">Missed Visit</SelectItem>
                          <SelectItem value="payment_due">Payment Due</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="feedback_request">Feedback Request</SelectItem>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{placeholderWarningMessage}</strong>
                </AlertDescription>
              </Alert>
              
              <div>
                <Label>Preview</Label>
                <div className="border rounded-lg p-3 bg-muted text-sm min-h-[100px]">
                  {formData.content || 'Enter content to see preview...'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.content || !!validationError}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
            <DialogDescription>
              Modify your plain SMS template
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value: 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other') => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Message Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your plain SMS message..."
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.content.length} characters ({Math.ceil(formData.content.length / 160)} SMS units)
                </p>
                {validationError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {validationError}
                  </p>
                )}
              </div>
              
              {/* Auto-trigger section */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-autoTrigger"
                    checked={formData.isAutoTriggered}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAutoTriggered: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="edit-autoTrigger">Enable Auto-trigger</Label>
                </div>
                
                {formData.isAutoTriggered && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="edit-triggerEvent">Trigger Event</Label>
                      <Select 
                        value={formData.triggerEvent} 
                        onValueChange={(value: 'appointment_booking' | 'appointment_cancellation' | 'missed_visit' | 'payment_due' | 'birthday' | 'feedback_request' | 'follow_up' | '') => 
                          setFormData(prev => ({ ...prev, triggerEvent: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment_booking">Appointment Booking</SelectItem>
                          <SelectItem value="appointment_cancellation">Appointment Cancellation</SelectItem>
                          <SelectItem value="missed_visit">Missed Visit</SelectItem>
                          <SelectItem value="payment_due">Payment Due</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="feedback_request">Feedback Request</SelectItem>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="edit-isActive">Active</Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{placeholderWarningMessage}</strong>
                </AlertDescription>
              </Alert>
              
              <div>
                <Label>Preview</Label>
                <div className="border rounded-lg p-3 bg-muted text-sm min-h-[100px]">
                  {formData.content || 'Enter content to see preview...'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || !formData.content || !!validationError}
            >
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              See how your template will look when sent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message Preview</Label>
              <div className="border rounded-lg p-3 bg-muted text-sm">
                {selectedTemplate?.content}
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{placeholderWarningMessage}</strong>
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <Label>Template Info:</Label>
                <div className="space-y-1 mt-2">
                  <div>Category: <Badge variant="outline">{selectedTemplate?.category}</Badge></div>
                  <div>Length: {selectedTemplate?.content.length || 0} chars</div>
                  <div>SMS Units: {Math.ceil((selectedTemplate?.content.length || 0) / 160)}</div>
                  {selectedTemplate?.isAutoTriggered && (
                    <div className="mt-2">
                      <div>Auto-trigger: <Badge variant="default">Enabled</Badge></div>
                      <div>Event: <Badge variant="secondary">{selectedTemplate?.triggerEvent}</Badge></div>
                      <div>Status: 
                        {selectedTemplate?.isActive !== false ? (
                          <Badge variant="default" className="ml-1">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-1">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedTemplate?.lastUsed && (
                    <div>Last Used: {new Date(selectedTemplate.lastUsed).toLocaleDateString()}</div>
                  )}
                  {selectedTemplate?.totalSent !== undefined && (
                    <div>Total Sent: {selectedTemplate.totalSent}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedSMSTemplateManager;