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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  getPatients,
  getSMSTemplates,
  getSMSCampaigns,
  sendBulkSMS,
  scheduleSMS
} from '@/lib/api';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import {
  Send,
  Users,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Search,
  X,
  RefreshCw,
  Download,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Patient {
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    gender?: string;
    dateOfBirth?: string;
  };
  treatments?: any[];
  createdAt: string;
  followUpDate?: string;
  totalDue?: number;
  totalPaid?: number;
}

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

interface FilterState {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  followUpDateRange: {
    from: Date | null;
    to: Date | null;
  };
  gender: string;
  paymentStatus: string;
  treatmentType: string;
  registrationDateFilter: string;
  ageRange: {
    min: number;
    max: number;
  };
  hasWhatsApp: boolean;
  customGroup: string;
}

interface SMSCampaign {
  _id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  totalPatients: number;
  sentCount: number;
  failedCount: number;
  scheduledFor?: string;
  createdAt: string;
}

// 定义API响应类型
interface PatientsApiResponse {
  success: boolean;
  data: {
    patientGroups: Patient[];
  };
  meta?: {
    totalPages: number;
    currentPage: number;
    totalPatients: number;
  };
}

interface TemplatesApiResponse {
  success: boolean;
  data: {
    templates: SMSTemplate[];
  };
}

interface CampaignsApiResponse {
  success: boolean;
  data: SMSCampaign[];
}

// 为API函数添加类型注解
const fetchPatients = async (): Promise<PatientsApiResponse> => {
  const result = await getPatients(1, 1000);
  return result as PatientsApiResponse;
};

const fetchTemplates = async (): Promise<TemplatesApiResponse> => {
  const result = await getSMSTemplates();
  return result as TemplatesApiResponse;
};

const fetchCampaigns = async (): Promise<CampaignsApiResponse> => {
  const result = await getSMSCampaigns();
  return result as CampaignsApiResponse;
};

export const EnhancedBulkSMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setSendingProgress] = useState(0);
  const [, setIsPreviewDialogOpen] = useState(false);


  // Form state
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: null, to: null },
    followUpDateRange: { from: null, to: null },
    gender: 'all',
    paymentStatus: 'all',
    treatmentType: 'all',
    registrationDateFilter: 'all',
    ageRange: { min: 0, max: 100 },
    hasWhatsApp: false,
    customGroup: 'all'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialogs

  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  // Fetch data
  const { data: patientsData, isLoading: patientsLoading } = useQuery<PatientsApiResponse>({
    queryKey: ['patients-bulk-sms'],
    queryFn: fetchPatients,
  });

  const { data: templatesData } = useQuery<TemplatesApiResponse>({
    queryKey: ['sms-templates'],
    queryFn: fetchTemplates,
  });

  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<CampaignsApiResponse>({
    queryKey: ['sms-campaigns'],
    queryFn: fetchCampaigns,
  });

  useEffect(() => {
    if (patientsData?.data?.patientGroups) {
      setAllPatients(patientsData.data.patientGroups);
      applyFilters(patientsData.data.patientGroups);
    }
  }, [patientsData]);

  useEffect(() => {
    if (templatesData?.data?.templates) {
      setTemplates(templatesData.data.templates);
    }
  }, [templatesData]);

  useEffect(() => {
    if (campaignsData?.data) {
      setCampaigns(campaignsData.data);
    }
  }, [campaignsData]);

  useEffect(() => {
    applyFilters(allPatients);
  }, [filters, searchQuery, allPatients]);

  const applyFilters = (patients: Patient[]) => {
    let filtered = patients.filter(patient => {
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = patient.personalDetails.name.toLowerCase().includes(searchLower);
        const matchesPhone = patient.personalDetails.contactNumber?.includes(searchQuery);
        if (!matchesName && !matchesPhone) return false;
      }

      // Gender filter
      if (filters.gender !== 'all' && patient.personalDetails.gender !== filters.gender) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus !== 'all') {
        const totalDue = patient.totalDue || 0;
        const totalPaid = patient.totalPaid || 0;

        if (filters.paymentStatus === 'due' && totalDue <= 0) return false;
        if (filters.paymentStatus === 'paid' && totalDue > 0) return false;
        if (filters.paymentStatus === 'partial' && (totalDue <= 0 || totalPaid <= 0)) return false;
      }

      // Registration date filter
      if (filters.dateRange.from && filters.dateRange.to) {
        const registrationDate = new Date(patient.createdAt);
        if (registrationDate < filters.dateRange.from || registrationDate > filters.dateRange.to) {
          return false;
        }
      }

      // Follow-up date filter
      if (filters.followUpDateRange.from && filters.followUpDateRange.to && patient.followUpDate) {
        const followUpDate = new Date(patient.followUpDate);
        if (followUpDate < filters.followUpDateRange.from || followUpDate > filters.followUpDateRange.to) {
          return false;
        }
      }

      // Age filter (if date of birth is available)
      if (patient.personalDetails.dateOfBirth) {
        const age = calculateAge(new Date(patient.personalDetails.dateOfBirth));
        if (age < filters.ageRange.min || age > filters.ageRange.max) {
          return false;
        }
      }

      // Must have valid contact number
      if (!patient.personalDetails.contactNumber || patient.personalDetails.contactNumber.length < 10) {
        return false;
      }

      return true;
    });

    setFilteredPatients(filtered);
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessage(template.content);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(filteredPatients.map(p => p._id));
    } else {
      setSelectedPatients([]);
    }
  };

  const handlePatientToggle = (patientId: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const generateCampaignName = () => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    return `Campaign_${date}_${time.replace(/:/g, '')}`;
  };

  const handleSendImmediate = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('Please select at least one patient');
      return;
    }

    const campaignNameToUse = campaignName || generateCampaignName();

    try {
      setLoading(true);
      setSendingProgress(0);

      await sendBulkSMS({
        patientIds: selectedPatients,
        message,
        campaignName: campaignNameToUse,
        templateId: selectedTemplate || undefined
      });

      toast.success(`SMS campaign started successfully! Sending to ${selectedPatients.length} patients.`);

      // Reset form
      setMessage('');
      setSelectedPatients([]);
      setCampaignName('');
      setSelectedTemplate('');

      // Switch to campaigns tab to monitor progress
      setActiveTab('campaigns');
      
      // Refresh campaigns data
      refetchCampaigns();

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send SMS');
    } finally {
      setLoading(false);
      setSendingProgress(0);
    }
  };

  const handleSchedule = async () => {
    if (!message.trim() || !scheduleDate || !scheduleTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedPatients.length === 0) {
      toast.error('Please select at least one patient');
      return;
    }

    const scheduledDateTime = new Date(scheduleDate);
    const [hours, minutes] = scheduleTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

    if (scheduledDateTime <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    const campaignNameToUse = campaignName || generateCampaignName();

    try {
      setLoading(true);

      await scheduleSMS({
        patientIds: selectedPatients,
        message,
        campaignName: campaignNameToUse,
        templateId: selectedTemplate || undefined,
        scheduledFor: scheduledDateTime.toISOString()
      });

      toast.success(`SMS campaign scheduled successfully for ${scheduledDateTime.toLocaleString()}`);

      setIsScheduleDialogOpen(false);
      setMessage('');
      setSelectedPatients([]);
      setCampaignName('');
      setSelectedTemplate('');
      setScheduleDate(undefined);
      setScheduleTime('');

      // Refresh campaigns data
      refetchCampaigns();

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule SMS');
    } finally {
      setLoading(false);
    }
  };

  const exportPatientList = () => {
    const csvContent = [
      ['Name', 'Phone', 'Gender', 'Registration Date', 'Total Due', 'Follow-up Date'].join(','),
      ...filteredPatients.map(patient => [
        patient.personalDetails.name,
        patient.personalDetails.contactNumber,
        patient.personalDetails.gender || 'N/A',
        new Date(patient.createdAt).toLocaleDateString(),
        patient.totalDue || 0,
        patient.followUpDate ? new Date(patient.followUpDate).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered-patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      followUpDateRange: { from: null, to: null },
      gender: 'all',
      paymentStatus: 'all',
      treatmentType: 'all',
      registrationDateFilter: 'all',
      ageRange: { min: 0, max: 100 },
      hasWhatsApp: false,
      customGroup: 'all'
    });
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk SMS</h1>
          <p className="text-muted-foreground">
            Send personalized SMS messages to multiple patients at once
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters and Patient Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Quick Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      >
                        Advanced
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or phone number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="payment-status">Payment Status</Label>
                      <Select value={filters.paymentStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="due">Has Due</SelectItem>
                          <SelectItem value="paid">Fully Paid</SelectItem>
                          <SelectItem value="partial">Partially Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Registration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateRange.from ? (
                              filters.dateRange.to ? (
                                `${format(filters.dateRange.from, "LLL dd")} - ${format(filters.dateRange.to, "LLL dd")}`
                              ) : (
                                format(filters.dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              "Pick a date range"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{ from: filters.dateRange.from!, to: filters.dateRange.to! }}
                            onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: { from: range?.from || null, to: range?.to || null } }))}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Follow-up Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.followUpDateRange.from ? (
                              filters.followUpDateRange.to ? (
                                `${format(filters.followUpDateRange.from, "LLL dd")} - ${format(filters.followUpDateRange.to, "LLL dd")}`
                              ) : (
                                format(filters.followUpDateRange.from, "LLL dd, y")
                              )
                            ) : (
                              "Pick a date range"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={{ from: filters.followUpDateRange.from!, to: filters.followUpDateRange.to! }}
                            onSelect={(range) => setFilters(prev => ({ ...prev, followUpDateRange: { from: range?.from || null, to: range?.to || null } }))}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Patients ({filteredPatients.length})
                      {selectedPatients.length > 0 && (
                        <Badge variant="secondary">
                          {selectedPatients.length} selected
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportPatientList}
                        disabled={filteredPatients.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Checkbox
                        checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {patientsLoading ? (
                    <div className="text-center py-8">Loading patients...</div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients found matching your criteria
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Due Amount</TableHead>
                            <TableHead>Follow-up</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPatients.slice(0, 100).map(patient => (
                            <TableRow key={patient._id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedPatients.includes(patient._id)}
                                  onCheckedChange={() => handlePatientToggle(patient._id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {patient.personalDetails.name}
                              </TableCell>
                              <TableCell>{patient.personalDetails.contactNumber}</TableCell>
                              <TableCell>
                                {patient.personalDetails.gender ? (
                                  <Badge variant="outline">{patient.personalDetails.gender}</Badge>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                {patient.totalDue ? (
                                  <Badge variant="destructive">
                                    NPR {patient.totalDue.toLocaleString()}
                                  </Badge>
                                ) : (
                                  <Badge variant="default">Paid</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {patient.followUpDate ? (
                                  new Date(patient.followUpDate).toLocaleDateString()
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {filteredPatients.length > 100 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Showing first 100 patients. Use filters to narrow down the selection.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Message Composition */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Message</CardTitle>
                  <CardDescription>
                    Create your SMS message using templates or custom text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name (Optional)</Label>
                    <Input
                      id="campaign-name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-select">Select Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No template</SelectItem>
                        {templates.map(template => (
                          <SelectItem key={template._id} value={template._id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="min-h-[150px]"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {message.length} characters ({Math.ceil(message.length / 160)} SMS units)
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Preview</AlertTitle>
                    <AlertDescription>
                      {message || 'Enter a message to see preview...'}
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendImmediate}
                      disabled={loading || selectedPatients.length === 0 || !message.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Now ({selectedPatients.length})
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setIsScheduleDialogOpen(true)}
                      disabled={loading || selectedPatients.length === 0 || !message.trim()}
                      className="w-full"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setIsPreviewDialogOpen(true)}
                      disabled={!message.trim()}
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SMS Campaigns</CardTitle>
              <CardDescription>
                Monitor and manage your SMS campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No campaigns found. Start by composing your first bulk SMS.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Patients</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Scheduled For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map(campaign => (
                      <TableRow key={campaign._id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              campaign.status === 'completed' ? 'default' :
                              campaign.status === 'failed' ? 'destructive' :
                              campaign.status === 'in_progress' ? 'secondary' : 'outline'
                            }
                          >
                            {campaign.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.totalPatients}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {campaign.sentCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.failedCount > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              {campaign.failedCount}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {campaign.scheduledFor ? (
                            new Date(campaign.scheduledFor).toLocaleString()
                          ) : (
                            'Immediate'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>SMS Analytics</CardTitle>
              <CardDescription>
                View SMS usage statistics and delivery reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule SMS Campaign</DialogTitle>
            <DialogDescription>
              Choose when to send your SMS to {selectedPatients.length} patients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="schedule-time">Schedule Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={loading}>
              Schedule SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedBulkSMS;