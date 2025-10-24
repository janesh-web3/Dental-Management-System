import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-toastify';
import { 
  Send, 
  Search, 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { crudRequest } from '@/lib/api';
import SMSScheduler from '@/components/sms/SMSScheduler';

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    emailAddress?: string;
    dateOfBirth?: string;
  };
  lastAppointment?: string;
}

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
}

export default function SingleSMSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // Search for patients
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['patientSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const response = await crudRequest<{ data: any[] }>('POST', '/patient/search', { 
        query: searchQuery, 
        limit: 5 
      });
      
      return response?.data || [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Fetch SMS templates
  const { data: templateData } = useQuery({
    queryKey: ['smsTemplates'],
    queryFn: async () => {
      const response = await crudRequest<any>('GET', '/sms/templates');
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

  useEffect(() => {
    if (templateData) {
      setTemplates(templateData);
    }
  }, [templateData]);

  // Handle sending SMS
  const handleSendSMS = async (scheduledFor?: Date) => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!message.trim() && !selectedTemplate) {
      toast.error('Please enter a message or select a template');
      return;
    }

    setIsSending(true);
    
    try {
      const requestData: any = {
        phoneNumber: selectedPatient.personalDetails.contactNumber,
        patientId: selectedPatient._id,
      };

      if (selectedTemplate) {
        requestData.templateId = selectedTemplate;
        // Add variables if needed
        requestData.variables = {
          patientName: selectedPatient.personalDetails.name,
          // Add more variables as needed
        };
      } else {
        requestData.message = message;
      }

      if (scheduledFor) {
        requestData.scheduledFor = scheduledFor.toISOString();
      }

      const response = await crudRequest<{ 
        success: boolean; 
        message?: string;
        scheduled?: boolean;
        scheduledFor?: string;
      }>('POST', '/sms/single', requestData);

      if (response?.success) {
        if (response.scheduled) {
          toast.success(`SMS scheduled for ${new Date(response.scheduledFor!).toLocaleString()}`);
        } else {
          toast.success('SMS sent successfully');
        }
        setMessage('');
        setSelectedTemplate('');
        setSelectedPatient(null);
        setSearchQuery('');
      } else {
        throw new Error(response?.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    if (templateId === '__no_template__') {
      setSelectedTemplate('');
      setMessage('');
      return;
    }
    
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  // Handle scheduling
  const handleSchedule = (scheduledDate: Date) => {
    setIsSchedulerOpen(false);
    handleSendSMS(scheduledDate);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Send SMS</h1>
          <p className="text-muted-foreground">
            Send an SMS to a single patient
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          disabled={isSending}
        >
          Back
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recipient</CardTitle>
            <CardDescription>
              Search and select a patient to receive the SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPatient ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isLoading && searchQuery.trim() && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}

                {!isLoading && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
                    No patients found
                  </div>
                )}

                {!isLoading && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((patient: Patient) => (
                      <div 
                        key={patient._id}
                        className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <div>
                          <p className="font-medium">{patient.personalDetails.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{patient.personalDetails.contactNumber}</span>
                            {patient.personalDetails.emailAddress && (
                              <>
                                <span>•</span>
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">
                                  {patient.personalDetails.emailAddress}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {patient.lastAppointment && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDate(patient.lastAppointment)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        {selectedPatient.personalDetails.name}
                      </h3>
                    </div>
                    <div className="mt-2 space-y-1 pl-7 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.personalDetails.contactNumber}</span>
                      </div>
                      {selectedPatient.personalDetails.emailAddress && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPatient.personalDetails.emailAddress}</span>
                        </div>
                      )}
                      {selectedPatient.personalDetails.dateOfBirth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>DOB: {formatDate(selectedPatient.personalDetails.dateOfBirth)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPatient(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Compose your SMS message or select a template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_template__">No template</SelectItem>
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
                    onClick={() => {
                      setSelectedTemplate('');
                      setMessage('');
                    }}
                    className="mt-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Template
                  </Button>
                )}
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here or select a template..."
                  className="min-h-[150px]"
                  maxLength={160}
                  disabled={!selectedPatient || !!selectedTemplate}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{message.length}/160 characters</span>
                  <span>
                    {Math.ceil(message.length / 160)} message
                    {message.length > 160 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Variables */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Label>Available Variables</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: '{{patientName}}', description: 'Patient\'s full name' },
                    { name: '{{date}}', description: 'Current date' },
                    { name: '{{time}}', description: 'Current time' },
                    { name: '{{clinicName}}', description: 'Your clinic name' },
                  ].map((variable) => (
                    <Tooltip key={variable.name}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setMessage(prev => prev + ' ' + variable.name);
                          }}
                          disabled={!selectedPatient || !!selectedTemplate}
                        >
                          {variable.name}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{variable.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsSchedulerOpen(true)}
                  disabled={isSending || !selectedPatient || (!message.trim() && !selectedTemplate)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Schedule
                </Button>
                <Button 
                  onClick={() => handleSendSMS()}
                  disabled={isSending || !selectedPatient || (!message.trim() && !selectedTemplate)}
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler Dialog */}
      <SMSScheduler 
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onSchedule={handleSchedule}
      />
    </div>
  );
}