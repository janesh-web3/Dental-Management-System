import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { Send, RefreshCw, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { crudRequest } from '@/lib/api';
import { BulkSMSFilter } from '@/components/sms/BulkSMSFilter';



type ProcedureGroup = {
  _id: string;
  name: string;
};

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
  };
}

export default function BulkSMSPage() {
  const [message, setMessage] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [filteredCount, setFilteredCount] = useState<number | null>(null);

  // Fetch procedure groups for filters
  const { data: procedureGroups = [] } = useQuery<ProcedureGroup[]>({
    queryKey: ['procedureGroups'],
    queryFn: async () => {
      const response = await crudRequest<{ data: ProcedureGroup[] }>('GET', '/api/procedure-groups');
      return response?.data || [];
    },
  });

  // Apply filters and get count of matching patients
  const applyFilters = async (appliedFilters: Record<string, unknown>) => {
    try {
      setFilters(appliedFilters);
      
      // Call API to get count of matching patients
      const response = await crudRequest<{ count: number }>('POST', '/api/patient/count', appliedFilters);
      setFilteredCount(response?.count || 0);
      setSelectedPatients([]); // Reset selected patients when filters change
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    }
  };

  // Fetch patients based on filters
  const { data: filteredPatients = [], isLoading } = useQuery({
    queryKey: ['filteredPatients', filters],
    queryFn: async () => {
      if (Object.keys(filters).length === 0) return [];
      
      const response = await crudRequest<{ data: any[] }>('POST', '/api/patient', { ...filters, limit: 1000 });
      return response?.data || [];
    },
    enabled: Object.keys(filters).length > 0,
  });

  // Handle sending bulk SMS
  const handleSendBulkSMS = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('No recipients selected');
      return;
    }

    setIsSending(true);
    
    try {
      const response = await crudRequest<{ 
        success: boolean; 
        sentCount: number; 
        message?: string 
      }>('POST', '/api/sms/bulk', {
        patientIds: selectedPatients.map(p => p._id),
        message,
      });

      if (response?.success) {
        toast.success(`SMS sent successfully to ${response.sentCount} recipients`);
        setMessage('');
        setSelectedPatients([]);
      } else {
        throw new Error(response?.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending bulk SMS:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle patient selection
  const togglePatientSelection = (patient: Patient) => {
    setSelectedPatients(prev => {
      const isSelected = prev.some(p => p._id === patient._id);
      if (isSelected) {
        return prev.filter(p => p._id !== patient._id);
      } else {
        return [...prev, patient];
      }
    });
  };

  // Select all filtered patients
  const selectAllPatients = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients([...filteredPatients]);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bulk SMS</h1>
          <p className="text-muted-foreground">
            Send SMS to multiple patients at once
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button 
            onClick={handleSendBulkSMS} 
            disabled={isSending || selectedPatients.length === 0}
            className="gap-2"
          >
            {isSending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedPatients.length} {selectedPatients.length === 1 ? 'Patient' : 'Patients'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
            <CardDescription>
              Filter and select patients to receive the SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkSMSFilter 
              onFilter={applyFilters}
              onReset={() => {
                setFilters({});
                setFilteredCount(null);
                setSelectedPatients([]);
              }}
              procedureGroups={procedureGroups}
              loading={isLoading}
            />

            {filteredCount !== null && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">
                      {filteredCount} {filteredCount === 1 ? 'patient' : 'patients'} found
                    </span>
                  </div>
                  {filteredCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={selectAllPatients}
                    >
                      {selectedPatients.length === filteredPatients.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>

                {filteredCount > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredPatients.map((patient: Patient) => {
                        const isSelected = selectedPatients.some(p => p._id === patient._id);
                        return (
                          <div 
                            key={patient._id}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-primary/10 border-primary' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => togglePatientSelection(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{patient.personalDetails.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {patient.personalDetails.contactNumber}
                                </p>
                              </div>
                              {isSelected ? (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
            <CardDescription>
              Compose your SMS message (max 160 characters)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[150px]"
                  maxLength={160}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{message.length}/160 characters</span>
                  <span>
                    {Math.ceil(message.length / 160)} message
                    {message.length > 160 ? 's' : ''}
                  </span>
                </div>
              </div>

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
