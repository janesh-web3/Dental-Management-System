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

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
  };
  name: string;
  contactNumber: string;
}

export default function BulkSMSPage() {
  const [message, setMessage] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Apply filters from the filter component
  const applyFilters = async (appliedFilters: Filters) => {
    try {
      
      // Convert filter values to undefined if they are 'all' or empty
      const cleanFilters = Object.entries(appliedFilters).reduce<Record<string, any>>((acc, [key, value]) => {
        if (value === 'all' || value === '' || value === null) {
          return acc; // Skip this filter
        }
        
        // Handle date range filter specifically
        if (key === 'dateRange' && value && typeof value === 'object') {
          if ('from' in value || 'to' in value) {
            const dateRange: any = {};
            if (value.from) dateRange.from = value.from;
            if (value.to) dateRange.to = value.to;
            
            if (Object.keys(dateRange).length > 0) {
              acc.dateRange = dateRange;
            }
            return acc;
          }
        }
        
        return { ...acc, [key]: value };
      }, {});

      
      // Check if any filters are active
      const hasActiveFilters = Object.keys(cleanFilters).length > 0;
      setIsFilterActive(hasActiveFilters);
      
      setFilters(cleanFilters);
      setSelectedPatients([]); // Reset selected patients when filters change
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
    setFilteredCount(null);
    setSelectedPatients([]);
    setIsFilterActive(false);
  };

  // Fetch patients based on filters
  const { data: filteredPatients = [], isLoading } = useQuery({
    queryKey: ['filteredPatients', filters, isFilterActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value === 'all' || value === undefined || value === null) return;
        
        if (key === 'dateRange' && value && typeof value === 'object') {
          if (value.from) params.append('from', value.from);
          if (value.to) params.append('to', value.to);
        } else {
          params.append(key, String(value));
        }
      });
      
      
      const url = isFilterActive 
        ? `/patient/get-filtered-patients?${params.toString()}`
        : `/patient/get-filtered-patients?limit=1000`;
    
      const response = await crudRequest<{ patients: any[], totalPatients?: number }>('GET', url);
      
      if (!response?.patients) {
        throw new Error('Failed to fetch patients');
      }
      
      const patients = response.patients;
      const total = response.totalPatients || patients.length;
      
      // Map the patient data to match the expected format
      const mappedPatients = patients.map(patient => ({
        _id: patient._id,
        personalDetails: {
          name: patient.personalDetails?.name || 'No Name',
          contactNumber: patient.personalDetails?.contactNumber || 'No Contact',
          gender: patient.personalDetails?.gender || 'Other',
          ...patient.personalDetails
        },
        medicalDetails: {
          group: patient.medicalDetails?.group || 'General',
          ...patient.medicalDetails
        },
        ...patient
      }));
      
      setFilteredCount(total);
      return mappedPatients;
    },
    // Always enabled - will fetch all patients when no filters are applied
    enabled: true,
  });

  // Handle sending bulk SMS
  const handleSendBulkSMS = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setIsSending(true);
    
    try {
      // Prepare the SMS data
      const smsData = {
        patientIds: selectedPatients.map(p => p._id),
        message: message.trim(),
        // Include filters for analytics
        filters: filters
      };

      console.log('Sending bulk SMS to patients:', smsData);
      
      const response = await crudRequest<{ 
        success: boolean; 
        totalSent: number; 
        totalFailed: number;
        message?: string;
        invalidMessages?: Array<{ recipient: string; reason: string }>;
      }>('POST', '/sms/bulk', smsData);

      if (response?.success) {
        const successMessage = `SMS sent successfully to ${response.totalSent} ${response.totalSent === 1 ? 'recipient' : 'recipients'}`;
        const failedMessage = response.totalFailed > 0 
          ? ` (${response.totalFailed} failed)` 
          : '';
        
        toast.success(successMessage + failedMessage);
        
        // Reset the form if everything was successful
        if (response.totalFailed === 0) {
          setMessage('');
          setSelectedPatients([]);
        }
        
        // If there were invalid messages, log them
        if (response.invalidMessages?.length) {
          console.error('Failed to send SMS to some recipients:', response.invalidMessages);
        }
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
              onReset={resetFilters}
              loading={isLoading}
            />

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {isLoading ? (
                    <span className="font-medium">Loading patients...</span>
                  ) : (
                    <span className="font-medium">
                      {filteredCount !== null ? (
                        <>
                          {filteredCount} {filteredCount === 1 ? 'patient' : 'patients'} found
                          {isFilterActive && <span className="ml-1 text-muted-foreground">(filtered)</span>}
                        </>
                      ) : (
                        'No patients loaded'
                      )}
                    </span>
                  )}
                </div>
                {filteredCount !== null && filteredCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selectAllPatients}
                  >
                    {selectedPatients.length === filteredPatients.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>

              {filteredCount !== null && filteredCount > 0 && (
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

              {filteredCount === 0 && (
                <div className="mt-4 p-4 text-center bg-muted rounded-md">
                  <p className="text-muted-foreground">No patients match the selected filters.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilters({});
                      setFilteredCount(null);
                    }}
                    className="mt-2"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
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
  