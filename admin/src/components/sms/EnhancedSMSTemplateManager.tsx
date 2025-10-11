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
  Upload
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other';
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_CATEGORIES = [
  'Appointment',
  'Reminder',
  'Promotion',
  'General',
  'Other'
];

const COMMON_VARIABLES = [
  '{{patientName}}',
  '{{clinicName}}',
  '{{doctorName}}',
  '{{appointmentDate}}',
  '{{appointmentTime}}',
  '{{amount}}',
  '{{dueDate}}',
  '{{contactNumber}}',
  '{{treatmentType}}',
  '{{followUpDate}}'
];

export const EnhancedSMSTemplateManager: React.FC = () => {
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
    category: 'General' as 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other',
    variables: [] as string[]
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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{ data: SMSTemplate[] }>('GET', '/sms/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch SMS templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex) || [];
    return [...new Set(matches)];
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.content.slice(0, start) + variable + formData.content.slice(end);
      setFormData(prev => ({
        ...prev,
        content: newContent,
        variables: extractVariables(newContent)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        content: prev.content + variable,
        variables: extractVariables(prev.content + variable)
      }));
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      variables: extractVariables(content)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      category: 'General' as 'Appointment' | 'Reminder' | 'Promotion' | 'General' | 'Other',
      variables: []
    });
  };

  const handleCreate = async () => {
    try {
      const response = await crudRequest<{ data: SMSTemplate }>('POST', '/sms/templates', formData);
      setTemplates(prev => [response.data, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('SMS template created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await crudRequest<{ data: SMSTemplate }>('PUT', `/sms/templates/${selectedTemplate._id}`, formData);
      setTemplates(prev => prev.map(t => t._id === selectedTemplate._id ? response.data : t));
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
      variables: template.variables
    });
    setIsCreateDialogOpen(true);
  };

  const renderPreview = () => {
    if (!selectedTemplate) return '';

    let preview = selectedTemplate.content;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, value);
    });
    return preview;
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
                  <TableHead>Variables</TableHead>
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
                      <Badge variant="secondary">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{template.createdBy.name}</TableCell>
                    <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
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
                              variables: template.variables
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
              Create a new SMS template with variables for personalized messages
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
                  placeholder="Enter your message template..."
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.content.length} characters ({Math.ceil(formData.content.length / 160)} SMS units)
                </p>
              </div>
              {formData.variables.length > 0 && (
                <div>
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Common Variables</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {COMMON_VARIABLES.map(variable => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      className="justify-start text-xs"
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>
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
              disabled={!formData.name || !formData.content}
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
              Modify your SMS template
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
                  placeholder="Enter your message template..."
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.content.length} characters ({Math.ceil(formData.content.length / 160)} SMS units)
                </p>
              </div>
              {formData.variables.length > 0 && (
                <div>
                  <Label>Detected Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Common Variables</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {COMMON_VARIABLES.map(variable => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable)}
                      className="justify-start text-xs"
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>
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
              disabled={!formData.name || !formData.content}
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
              See how your template will look with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Original Template</Label>
              <div className="border rounded-lg p-3 bg-muted text-sm">
                {selectedTemplate?.content}
              </div>
            </div>
            <div>
              <Label>Preview with Sample Data</Label>
              <div className="border rounded-lg p-3 bg-background text-sm">
                {renderPreview()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <Label>Sample Data Used:</Label>
                <div className="space-y-1 mt-2">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{`{{${key}}}:`}</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Template Info:</Label>
                <div className="space-y-1 mt-2">
                  <div>Category: <Badge variant="outline">{selectedTemplate?.category}</Badge></div>
                  <div>Variables: {selectedTemplate?.variables.length || 0}</div>
                  <div>Length: {selectedTemplate?.content.length || 0} chars</div>
                  <div>SMS Units: {Math.ceil((selectedTemplate?.content.length || 0) / 160)}</div>
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