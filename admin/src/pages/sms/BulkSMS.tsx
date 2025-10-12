import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-toastify';
import { Send, Eye, FileText, Users, Edit, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { crudRequest, getPatientGroups, getGroupPatients, updatePatientGroup, getPatients } from '@/lib/api';

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

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
  };
}

// Add this new interface for the patient management
interface GroupPatient extends Patient {
  isInGroup: boolean;
}

export default function BulkSMSPage() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const [editingGroup, setEditingGroup] = useState<PatientGroup | null>(null);
  const [groupPatients, setGroupPatients] = useState<Patient[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [availablePatients, setAvailablePatients] = useState<GroupPatient[]>([]); // New state for available patients
  const [searchTerm, setSearchTerm] = useState(''); // New state for patient search

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

  // Fetch patients for selected group
  const { data: groupPatientsData, refetch: refetchGroupPatients } = useQuery({
    queryKey: ['groupPatients', selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const response: any = await getGroupPatients(selectedGroup);
      return Array.isArray(response.data?.patients) ? response.data.patients : [];
    },
    enabled: !!selectedGroup,
  });

  // Fetch all patients for group management
  const { data: allPatientsData } = useQuery({
    queryKey: ['allPatients'],
    queryFn: async () => {
      const response: any = await getPatients(1, 1000);
      return Array.isArray(response.data?.patients) ? response.data.patients : 
             Array.isArray(response.data) ? response.data : [];
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

  useEffect(() => {
    if (groupPatientsData) {
      setGroupPatients(groupPatientsData);
    }
  }, [groupPatientsData]);

  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setGroupDescription(editingGroup.description || '');
    }
  }, [editingGroup]);

  useEffect(() => {
    if (allPatientsData && selectedGroup) {
      // Combine all patients with group patients to show which are in the group
      const groupPatientIds = new Set(groupPatients.map(p => p._id));
      const patientsWithGroupStatus = allPatientsData.map((patient: Patient) => ({
        ...patient,
        isInGroup: groupPatientIds.has(patient._id)
      }));
      setAvailablePatients(patientsWithGroupStatus);
    }
  }, [allPatientsData, groupPatients, selectedGroup]);

  // Send SMS to group mutation
  const sendToGroupMutation = useMutation({
    mutationFn: async ({ groupId, messageData }: { groupId: string; messageData: any }) => {
      const response: { 
        success: boolean; 
        data?: any; 
        message?: string; 
        groupName?: string;
        totalSent?: number;
        totalFailed?: number;
        failedMessages?: Array<{phoneNumber: string, error: string}>;
        validMessages?: number;
        invalidMessages?: number;
      } = await crudRequest('POST', `/sms/group/${groupId}`, messageData);
      
      // Throw error if response indicates failure
      if (response?.success === false || (response?.totalSent === 0 && (response?.validMessages ?? 0) > 0)) {
        throw new Error(response?.message || 'Failed to send SMS to group');
      }
      
      return response;
    },
    onSuccess: (response: { 
      success: boolean; 
      data?: any; 
      message?: string; 
      groupName?: string;
      totalSent?: number;
      totalFailed?: number;
      failedMessages?: Array<{phoneNumber: string, error: string}>;
      validMessages?: number;
      invalidMessages?: number;
    }) => {
      // This will only be called if the mutation doesn't throw an error
      if (response?.totalSent === 0 && (response?.validMessages ?? 0) > 0) {
        toast.error(`Failed to send SMS to group: ${response?.groupName || 'Unknown Group'}. No messages were delivered.`);
      } else if (response?.totalFailed && response.totalFailed > 0) {
        toast.warn(`SMS sent to group: ${response?.groupName || 'Unknown Group'}. ${response.totalSent} sent, ${response.totalFailed} failed.`);
      } else if (response?.totalSent === 0 && (response?.validMessages === 0 || response?.validMessages === undefined)) {
        toast.warn(`No valid recipients found in group: ${response?.groupName || 'Unknown Group'}.`);
      } else {
        toast.success(`SMS sent successfully to group: ${response?.groupName || 'Unknown Group'}! ${response?.totalSent || 0} messages delivered.`);
      }
      // Reset selections after successful send
      setSelectedGroup('');
      setSelectedTemplate('');
    },
    onError: (error: any) => {
      console.error('SMS sending error:', error);
      toast.error(error.message || 'Failed to send SMS to group');
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: any }) => {
      const response: any = await updatePatientGroup(groupId, data);
      return response;
    },
    onSuccess: () => {
      toast.success('Group updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patientGroups'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Group update error:', error);
      toast.error(error.message || 'Failed to update group');
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
    
    // Show the raw template content without variable replacement
    setPreviewContent(template.content);
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
    
    // Check SMS credit before sending (but make it optional)
    let hasSufficientCredit = true;
    let availableCredit = 0;
    
    try {
      const creditResponse: { success: boolean; availableCredit?: number; message?: string } = await crudRequest('GET', '/sms/credit');
      console.log('Credit check response:', creditResponse);
      
      if (creditResponse?.success && creditResponse?.availableCredit !== undefined) {
        availableCredit = creditResponse.availableCredit;
        if (availableCredit <= 0) {
          hasSufficientCredit = false;
          toast.warn('Insufficient SMS credit. Attempting to send SMS anyway.');
        }
      } else {
        // Credit check failed, but we'll still try to send
        hasSufficientCredit = false;
        toast.warn('Could not verify SMS credit. Attempting to send SMS anyway.');
      }
    } catch (error: any) {
      console.error('Credit check error:', error);
      // Even if credit check fails, we'll still try to send
      hasSufficientCredit = false;
      toast.warn('Could not verify SMS credit. Attempting to send SMS anyway.');
    }
    
    // Check if group has more patients than available credit (only if we have valid credit info)
    if (hasSufficientCredit && availableCredit > 0) {
      const selectedGroupData = groups.find(g => g._id === selectedGroup);
      if (selectedGroupData && availableCredit < selectedGroupData?.patientCount) {
        const confirm = window.confirm(
          `You have ${availableCredit} credits but the group has ${selectedGroupData?.patientCount} patients. ` +
          `Some messages may not be sent. Do you want to continue?`
        );
        
        if (!confirm) {
          return;
        }
      }
    }
    
    // Send SMS to group
    try {
      await sendToGroupMutation.mutateAsync({
        groupId: selectedGroup,
        messageData: {
          templateId: selectedTemplate
        }
      });
    } catch (error: any) {
      console.error('SMS sending error:', error);
      const errorMessage = error?.message || error?.error || 'Failed to send SMS to group';
      toast.error(errorMessage);
    }
  };

  // Handle edit group
  const handleEditGroup = (group: PatientGroup) => {
    setEditingGroup(group);
    setIsEditing(true);
  };

  // Handle save group
  const handleSaveGroup = async () => {
    if (!editingGroup) return;
    
    try {
      await updateGroupMutation.mutateAsync({
        groupId: editingGroup._id,
        data: {
          name: groupName,
          description: groupDescription
        }
      });
    } catch (error: any) {
      console.error('Group update error:', error);
      toast.error(error.message || 'Failed to update group');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
  };

  // Handle adding/removing patient from group
  const handlePatientGroupToggle = async (patientId: string, currentlyInGroup: boolean) => {
    if (!selectedGroup) return;
    
    try {
      // Get current group data
      const currentGroup = groups.find(g => g._id === selectedGroup); 
      if (!currentGroup) return;
      
      // Get current patient IDs in group
      let currentPatientIds = [...groupPatients.map(p => p._id)];
      
      if (currentlyInGroup) {
        // Remove patient from group
        currentPatientIds = currentPatientIds.filter(id => id !== patientId);
      } else {
        // Add patient to group
        currentPatientIds.push(patientId);
      }
      
      // Update the group with new patient IDs
      await updateGroupMutation.mutateAsync({
        groupId: selectedGroup,
        data: {
          patientIds: currentPatientIds
        }
      });
      
      // Refresh the group patients data
      refetchGroupPatients();
      
      toast.success(currentlyInGroup ? 'Patient removed from group' : 'Patient added to group');
    } catch (error: any) {
      console.error('Error updating patient group:', error);
      toast.error(error.message || 'Failed to update patient group');
    }
  };

  // Filter patients based on search term
  const filteredPatients = availablePatients.filter(patient => 
    patient.personalDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.personalDetails.contactNumber.includes(searchTerm)
  );

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Send SMS</TabsTrigger>
          <TabsTrigger value="groups">Manage Groups</TabsTrigger>
          <TabsTrigger value="patients">Manage Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
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
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Patient Groups
              </CardTitle>
              <CardDescription>
                Edit group details and manage group configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Enter group description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveGroup} disabled={updateGroupMutation.isPending}>
                      {updateGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Patient Groups</h3>
                  </div>
                  <div className="grid gap-4">
                    {groups.map((group) => (
                      <div key={group._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-muted-foreground">{group.description || 'No description'}</p>
                          <p className="text-sm">
                            {group.patientCount} patients • {group.category} group
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Group Patients
              </CardTitle>
              <CardDescription>
                View and manage patients in selected group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Select Group</Label>
                  <Select value={selectedGroup} onValueChange={handleGroupSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group to manage patients" />
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
                </div>

                {selectedGroup && selectedGroup !== '__no_group__' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Patients in {groups.find(g => g._id === selectedGroup)?.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {groupPatients.length} patients
                      </span>
                    </div>
                    
                    {/* Search input for patients */}
                    <div className="space-y-2">
                      <Label htmlFor="patientSearch">Search Patients</Label>
                      <Input
                        id="patientSearch"
                        placeholder="Search by name or contact number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="border rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-4">Patient Name</th>
                              <th className="text-left p-4">Contact Number</th>
                              <th className="text-right p-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map((patient) => (
                                <tr key={patient._id} className="border-b">
                                  <td className="p-4">{patient.personalDetails.name}</td>
                                  <td className="p-4">{patient.personalDetails.contactNumber}</td>
                                  <td className="p-4 text-right">
                                    <Button 
                                      variant={patient.isInGroup ? "destructive" : "outline"} 
                                      size="sm"
                                      onClick={() => handlePatientGroupToggle(patient._id, patient.isInGroup)}
                                    >
                                      {patient.isInGroup ? (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remove
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                  {searchTerm ? 'No patients match your search' : 'No patients found'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Summary of changes */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900">Group Management</h4>
                      <p className="text-sm text-blue-700">
                        Showing {filteredPatients.length} of {availablePatients.length} patients
                        {selectedGroup && (
                          <span> in group {groups.find(g => g._id === selectedGroup)?.name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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