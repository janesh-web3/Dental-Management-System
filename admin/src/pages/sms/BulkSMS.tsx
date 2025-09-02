import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'react-toastify';
import { Send, RefreshCw, MessageSquare, CheckCircle, Settings, History, Plus, Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { crudRequest } from '@/lib/api';
import { BulkSMSFilter } from '@/components/sms/BulkSMSFilter';

interface DateRange {
  from?: string;
  to?: string;
}

interface Filters {
  treatmentStatus?: string;
  procedure?: string;
  group?: string;
  dateRange?: DateRange;
  gender?: string;
  doctor?: string;
  [key: string]: any;
}

interface SMSClassConfig {
  _id: string;
  className: 'A' | 'B' | 'C';
  patientLimit: number;
  description: string;
  isActive: boolean;
}

interface SMSCampaign {
  _id: string;
  name: string;
  message: string;
  filters: Filters;
  totalPatients: number;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  classes: Array<{
    className: 'A' | 'B' | 'C';
    patientCount: number;
    sentCount: number;
    failedCount: number;
    isSent: boolean;
    sentAt?: string;
    patientIds: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function BulkSMSPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<SMSCampaign | null>(null);
  const [showClassSettings, setShowClassSettings] = useState(false);
  const [editingClass, setEditingClass] = useState<SMSClassConfig | null>(null);

  // Fetch SMS class configurations
  const { data: classConfigs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['smsClassConfigs'],
    queryFn: async () => {
      const response = await crudRequest<{ data: SMSClassConfig[] }>('GET', '/sms/class-configs');
      return response?.data || [];
    }
  });

  // Fetch campaigns
  const { data: campaignsData, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['smsCampaigns'],
    queryFn: async () => {
      const response = await crudRequest<{ data: { campaigns: SMSCampaign[] } }>('GET', '/sms/campaigns?limit=10');
      return response?.data?.campaigns || [];
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return await crudRequest('POST', '/sms/campaigns', campaignData);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['smsCampaigns'] });
      toast.success('Campaign created successfully!');
      setCurrentCampaign(response?.data);
      setMessage('');
      setCampaignName('');
      setFilters({});
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    }
  });

  // Send SMS to class mutation
  const sendToClassMutation = useMutation({
    mutationFn: async ({ campaignId, className }: { campaignId: string; className: string }) => {
      return await crudRequest('POST', `/sms/campaigns/${campaignId}/send/${className}`, {});
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['smsCampaigns'] });
      if (currentCampaign) {
        setCurrentCampaign(prev => {
          if (!prev) return null;
          const updatedClasses = prev.classes.map(cls => 
            cls.className === response?.className 
              ? { ...cls, isSent: true, sentCount: response?.totalSent || 0, failedCount: response?.totalFailed || 0, sentAt: new Date().toISOString() }
              : cls
          );
          return { ...prev, classes: updatedClasses };
        });
      }
      toast.success(response?.message || 'SMS sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send SMS');
    }
  });

  // Update class config mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ className, ...data }: { className: string; patientLimit: number; description: string }) => {
      return await crudRequest('PUT', `/sms/class-configs/${className}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smsClassConfigs'] });
      toast.success('Class configuration updated successfully!');
      setEditingClass(null);
      setShowClassSettings(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update class configuration');
    }
  });

  const handleCreateCampaign = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsCreatingCampaign(true);
    
    try {
      await createCampaignMutation.mutateAsync({
        message: message.trim(),
        filters,
        campaignName: campaignName.trim() || undefined
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleSendToClass = async (className: string) => {
    if (!currentCampaign) return;
    
    await sendToClassMutation.mutateAsync({
      campaignId: currentCampaign._id,
      className
    });
  };

  const handleUpdateClass = async (data: { patientLimit: number; description: string }) => {
    if (!editingClass) return;
    
    await updateClassMutation.mutateAsync({
      className: editingClass.className,
      ...data
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class-Based Bulk SMS</h1>
          <p className="text-muted-foreground">
            Send SMS to patients organized in classes (A, B, C)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowClassSettings(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Class Settings
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create New Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create SMS Campaign
            </CardTitle>
            <CardDescription>
              Create a new SMS campaign and divide patients into classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                />
              </div>
            </div>

            <BulkSMSFilter 
              onFilter={setFilters} 
              onReset={() => setFilters({})}
              loading={false}
            />

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[120px]"
                maxLength={160}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{message.length}/160 characters</span>
                <span>Available: {`{{patientName}}, {{date}}, {{time}}, {{clinicName}}`}</span>
              </div>
            </div>

            <Button 
              onClick={handleCreateCampaign} 
              disabled={isCreatingCampaign || !message.trim()}
              className="gap-2 w-full"
            >
              {isCreatingCampaign ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Campaign & Divide into Classes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Campaign */}
        {currentCampaign && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Current Campaign: {currentCampaign.name}
              </CardTitle>
              <CardDescription>
                Total Patients: {currentCampaign.totalPatients} | Status: 
                <Badge variant={
                  currentCampaign.status === 'completed' ? 'default' :
                  currentCampaign.status === 'in_progress' ? 'secondary' :
                  currentCampaign.status === 'failed' ? 'destructive' : 'outline'
                } className="ml-2">
                  {currentCampaign.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">Message:</p>
                  <p className="text-sm">{currentCampaign.message}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentCampaign.classes.map((classData) => (
                    <Card key={classData.className}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          Class {classData.className}
                          {classData.isSent && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="text-sm space-y-1">
                          <p><strong>Patients:</strong> {classData.patientCount}</p>
                          {classData.isSent && (
                            <>
                              <p className="text-green-600"><strong>Sent:</strong> {classData.sentCount}</p>
                              {classData.failedCount > 0 && (
                                <p className="text-red-600"><strong>Failed:</strong> {classData.failedCount}</p>
                              )}
                              <p className="text-muted-foreground text-xs">
                                Sent: {new Date(classData.sentAt!).toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleSendToClass(classData.className)}
                          disabled={classData.isSent || sendToClassMutation.isPending}
                          size="sm"
                          className="w-full gap-2"
                          variant={classData.isSent ? "secondary" : "default"}
                        >
                          {sendToClassMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : classData.isSent ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          {classData.isSent ? 'Sent' : `Send to Class ${classData.className}`}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              View and manage previous SMS campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading campaigns...</span>
              </div>
            ) : campaignsData && campaignsData.length > 0 ? (
              <div className="space-y-4">
                {campaignsData.slice(0, 5).map((campaign) => (
                  <div key={campaign._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {campaign.totalPatients} patients | {campaign.classes.length} classes | 
                        <Badge variant="outline" className="ml-2">
                          {campaign.status}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(campaign.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentCampaign(campaign)}
                        className="gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No campaigns found. Create your first campaign above.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Settings Dialog */}
      <Dialog open={showClassSettings} onOpenChange={setShowClassSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>SMS Class Settings</DialogTitle>
            <DialogDescription>
              Configure patient limits for each SMS class
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingConfigs ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : (
              classConfigs.map((config) => (
                <div key={config.className} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Class {config.className}</h4>
                    <p className="text-sm text-muted-foreground">
                      Limit: {config.patientLimit} patients
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingClass(config)}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class {editingClass?.className}</DialogTitle>
            <DialogDescription>
              Modify the patient limit for this class
            </DialogDescription>
          </DialogHeader>
          
          {editingClass && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleUpdateClass({
                patientLimit: Number(formData.get('patientLimit')),
                description: String(formData.get('description'))
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientLimit">Patient Limit</Label>
                <Input
                  id="patientLimit"
                  name="patientLimit"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={editingClass.patientLimit}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingClass.description}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingClass(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateClassMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {updateClassMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
  