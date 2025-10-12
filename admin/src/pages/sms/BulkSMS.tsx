import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-toastify';
import { Send, Eye, FileText, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { crudRequest, getPatientGroups } from '@/lib/api';

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
}

interface PatientGroup {
  _id: string;
  name: string;
  description: string;
  patientCount: number;
  category: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  lastUsed?: string;
}

export default function BulkSMSPage() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Fetch SMS templates
  const { data: templateData } = useQuery({
    queryKey: ['smsTemplates'],
    queryFn: async () => {
      const response: any = await crudRequest<any>('GET', '/sms/templates');
      // Handle different possible response structures
      if (Array.isArray(response)) {
        // Direct array response
        return response;
      } else if (response?.templates && Array.isArray(response.templates)) {
        // { templates: SMSTemplate[] } structure
        return response.templates;
      } else if (response?.data && Array.isArray(response.data)) {
        // { data: SMSTemplate[] } structure
        return response.data;
      }
      return [];
    },
  });

  // Fetch patient groups
  const { data: groupData } = useQuery({
    queryKey: ['patientGroups'],
    queryFn: async () => {
      const response: any = await getPatientGroups();
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  useEffect(() => {
    if (templateData) {
      setTemplates(templateData);
    }
  }, [templateData]);

  useEffect(() => {
    if (groupData) {
      setGroups(groupData);
    }
  }, [groupData]);

  // Send SMS to group mutation
  const sendToGroupMutation = useMutation({
    mutationFn: async ({ groupId, messageData }: { groupId: string; messageData: any }) => {
      return await crudRequest('POST', `/sms/group/${groupId}`, messageData);
    },
    onSuccess: (response: any) => {
      toast.success(`SMS sent successfully to group: ${response?.groupName || 'Unknown Group'}!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send SMS to group');
    }
  });

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    if (templateId === '__no_template__') {
      setSelectedTemplate('');
      return;
    }
    
    setSelectedTemplate(templateId);
  };

  // Handle group selection
  const handleGroupSelect = (groupId: string) => {
    if (groupId === '__no_group__') {
      setSelectedGroup('');
      return;
    }
    setSelectedGroup(groupId);
  };

  // Handle preview
  const handlePreview = () => {
    if (!selectedGroup || selectedGroup === '__no_group__') {
      toast.error('Please select a group');
      return;
    }
    
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    
    // Get the selected template content
    const template = templates.find(t => t._id === selectedTemplate);
    if (!template) {
      toast.error('Selected template not found');
      return;
    }
    
    // Create a preview with sample variables replaced
    let preview = template.content;
    
    // Replace common variables with sample values
    const sampleVariables: Record<string, string> = {
      patientName: 'John Doe',
      name: 'John Doe',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clinicName: 'Dental Clinic'
    };
    
    // Replace variables in the format {{variableName}}
    Object.keys(sampleVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      preview = preview.replace(regex, sampleVariables[key]);
    });
    
    // Remove any remaining placeholders
    preview = preview.replace(/{{[^{}]+}}/g, '[Variable]');
    
    setPreviewContent(preview);
    setShowPreview(true);
  };

  // Handle sending SMS to selected group
  const handleSendToGroup = async () => {
    if (!selectedGroup || selectedGroup === '__no_group__') {
      toast.error('Please select a group');
      return;
    }
    
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    
    await sendToGroupMutation.mutateAsync({
      groupId: selectedGroup,
      messageData: {
        templateId: selectedTemplate
      }
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Send Bulk SMS</h1>
          <p className="text-muted-foreground">
            Send SMS to selected patient groups
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Send SMS Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send SMS to Group
            </CardTitle>
            <CardDescription>
              Select a group and template, then send SMS to all patients in the group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Select Template *</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__no_template__">Select a template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && selectedTemplate !== '__no_template__' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedTemplate('')}
                  className="mt-1"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Clear Template
                </Button>
              )}
            </div>

            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">Select Group *</Label>
              <Select value={selectedGroup} onValueChange={handleGroupSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__no_group__">Select a group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {group.name} ({group.patientCount} patients)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroup && selectedGroup !== '__no_group__' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedGroup('')}
                  className="mt-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Clear Group
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handlePreview}
                disabled={!selectedGroup || selectedGroup === '__no_group__' || !selectedTemplate || selectedTemplate === '__no_template__'}
                variant="outline"
                className="gap-2 flex-1"
              >
                <Eye className="h-4 w-4" />
                Preview SMS
              </Button>
              
              <Button 
                onClick={handleSendToGroup} 
                disabled={sendToGroupMutation.isPending || !selectedGroup || selectedGroup === '__no_group__' || !selectedTemplate || selectedTemplate === '__no_template__'}
                className="gap-2 flex-1"
              >
                {sendToGroupMutation.isPending ? (
                  <>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send SMS
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SMS Preview</DialogTitle>
            <DialogDescription>
              This is how your SMS will appear to recipients
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
            </div>
            
            {selectedGroup && selectedGroup !== '__no_group__' && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900">Sending to Group</h4>
                <p className="text-sm text-blue-700">
                  {groups.find(g => g._id === selectedGroup)?.name || 'Selected Group'}: {
                    groups.find(g => g._id === selectedGroup)?.patientCount || 0
                  } patients
                </p>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              <p>Character count: {previewContent.length}/160</p>
              <p className="mt-1">Note: Variables like &#123;&#123;patientName&#125;&#125; will be replaced with actual patient information when sent.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowPreview(false);
                handleSendToGroup();
              }}
              disabled={sendToGroupMutation.isPending}
            >
              {sendToGroupMutation.isPending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}