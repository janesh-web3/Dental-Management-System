import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';
import { Send, Search, X, User, Phone, Mail, Calendar, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { crudRequest } from '@/lib/api';

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

export default function SingleSMSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Search for patients
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['patientSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const response = await crudRequest<{ data: any[] }>('POST', '/api/patient/search', { 
        query: searchQuery, 
        limit: 5 
      });
      
      return response?.data || [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Handle sending SMS
  const handleSendSMS = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    
    try {
      const response = await crudRequest<{ 
        success: boolean; 
        message?: string 
      }>('POST', '/api/sms/single', {
        patientId: selectedPatient._id,
        message,
      });

      if (response?.success) {
        toast.success('SMS sent successfully');
        setMessage('');
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
                  disabled={!selectedPatient}
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
                          disabled={!selectedPatient}
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

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleSendSMS} 
                  disabled={isSending || !selectedPatient || !message.trim()}
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
    </div>
  );
}
