import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';
import { CalendarIcon, Check, Plus, RefreshCw, Search, X } from 'lucide-react';

interface BulkSMSResponse {
  success: boolean;
  totalSent: number;
  totalErrors: number;
  results: Array<{
    patientId: string;
    messageId: string;
    status: string;
    to: string;
  }>;
  errors: Array<{
    patientId: string;
    error: string;
    code: string;
  }>;
}

interface SMSResponse {
  success: boolean;
  messageId: string;
  status: string;
  to: string;
  dateCreated: string;
  errorMessage?: string;
  errorCode?: string;
}

interface SMSTemplate {
  _id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface SMSHistoryItem {
  _id: string;
  recipient: string;
  message: string;
  status: string;
  messageId: string;
  networkProvider: string;
  credit: number;
  createdAt: string;
  patient: {
    _id: string;
    personalDetails: {
      name: string;
    };
  };
  sentBy: {
    _id: string;
    name: string;
  };
  templateUsed?: {
    _id: string;
    name: string;
  };
  scheduledFor?: string;
  isBulk: boolean;
}

interface PatientOption {
  _id: string;
  name: string;
  contactNumber: string;
}

const SMS = () => {
  // State for single SMS
  const [singleMessage, setSingleMessage] = useState({
    phoneNumber: '',
    message: '',
    patientId: '',
    templateId: '',
    scheduledDate: undefined as Date | undefined
  });

  // State for bulk SMS
  const [bulkMessage, setBulkMessage] = useState({
    message: '',
    templateId: '',
    patientIds: [] as string[],
    groupFilter: '',
    doctorFilter: '',
    scheduledDate: undefined as Date | undefined
  });

  // State for templates
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    variables: [] as string[],
    category: 'General'
  });

  // State for history
  const [smsHistory, setSMSHistory] = useState<SMSHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);

  // State for patients
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [showBulkSelection, setShowBulkSelection] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  
  // Function to format phone number to E.164 format for Nepal
  const formatPhoneNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // If the number starts with '977' (Nepal country code), keep it
    if (cleaned.startsWith('977')) {
      return `+${cleaned}`;
    }
    
    // If the number starts with '98' or '97' (Nepal mobile prefixes)
    if (cleaned.startsWith('98') || cleaned.startsWith('97')) {
      // If it's a 10-digit number, add Nepal country code
      if (cleaned.length === 10) {
        return `+977${cleaned}`;
      }
    }
    
    // If the number already has a country code, just add the + if missing
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates();
    fetchSMSHistory();
  }, []);

  // Fetch SMS templates
  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true);
      const response = await crudRequest<{ templates: SMSTemplate[] }>('GET', '/sms/templates');
      setTemplates(response.templates);
    } catch (error: any) {
      toast.error('Failed to load SMS templates');
      console.error(error);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Fetch SMS history
  const fetchSMSHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await crudRequest<{ 
        history: SMSHistoryItem[], 
        total: number,
        page: number
      }>('GET', `/sms/history?page=${historyPage}&limit=20`);
      
      setSMSHistory(response.history);
      setHistoryTotal(response.total);
    } catch (error: any) {
      toast.error('Failed to load SMS history');
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Search patients
  const searchPatients = async () => {
    if (!searchPatient) return;
    
    try {
      setPatientsLoading(true);
      const response = await crudRequest<{ patients: any[] }>('GET', `/patients/search?q=${searchPatient}`);
      
      // Format the patients data
      const formattedPatients = response.patients.map(patient => ({
        _id: patient._id,
        name: patient.personalDetails.name,
        contactNumber: patient.personalDetails.contactNumber
      }));
      
      setPatients(formattedPatients);
    } catch (error: any) {
      toast.error('Failed to search patients');
      console.error(error);
    } finally {
      setPatientsLoading(false);
    }
  };

  // Handle patient selection for single SMS
  const handlePatientSelect = (patient: PatientOption) => {
    setSingleMessage(prev => ({
      ...prev,
      phoneNumber: patient.contactNumber,
      patientId: patient._id
    }));
    setPatients([]);
    setSearchPatient('');
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplate(null);
      setSingleMessage(prev => ({
        ...prev,
        message: "",
        templateId: ""
      }));
      return;
    }

    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSingleMessage(prev => ({
        ...prev,
        message: template.content,
        templateId
      }));
    }
  };

  // Handle bulk template selection
  const handleBulkTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setSelectedTemplate(null);
      setBulkMessage(prev => ({
        ...prev,
        message: "",
        templateId: ""
      }));
      return;
    }
    
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setBulkMessage(prev => ({
        ...prev,
        message: template.content,
        templateId
      }));
    }
  };

  // Create new template
  const handleCreateTemplate = async () => {
    try {
      setTemplateLoading(true);
      await crudRequest<{ template: SMSTemplate }>('POST', '/sms/templates', newTemplate);
      
      toast.success('Template created successfully');
      setShowTemplateDialog(false);
      setNewTemplate({
        name: '',
        content: '',
        variables: [],
        category: 'General'
      });
      
      // Refresh templates
      fetchTemplates();
    } catch (error: any) {
      toast.error('Failed to create template');
      console.error(error);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Send single SMS
  const handleSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format the phone number before sending
      const formattedNumber = formatPhoneNumber(singleMessage.phoneNumber);
      
      const payload: any = {
        phoneNumber: formattedNumber,
        message: singleMessage.message,
      };
      
      if (singleMessage.patientId) {
        payload.patientId = singleMessage.patientId;
      }
      
      if (singleMessage.templateId && singleMessage.templateId !== "none") {
        payload.templateId = singleMessage.templateId;
      }
      
      if (singleMessage.scheduledDate) {
        payload.scheduledFor = singleMessage.scheduledDate.toISOString();
      }
      
      const response = await crudRequest<SMSResponse>('POST', '/sms/single', payload);
      
      console.log(response);
      
      if (response.success) {
        if (payload.scheduledFor) {
          toast.success('SMS scheduled successfully!');
        } else {
          toast.success('SMS sent successfully!');
        }
      }
      
      setSingleMessage({ 
        phoneNumber: '', 
        message: '', 
        patientId: '',
        templateId: '',
        scheduledDate: undefined
      });
      setSelectedTemplate(null);
      
      // Refresh history
      fetchSMSHistory();
    } catch (error: any) {
      // Show more detailed error message
      const errorMessage = error.response?.data?.error || 'Failed to send SMS';
      toast.error(errorMessage);
      
      console.error('SMS Error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Send bulk SMS
  const handleBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        message: bulkMessage.message,
      };
      
      if (bulkMessage.templateId && bulkMessage.templateId !== "none") {
        payload.templateId = bulkMessage.templateId;
      }
      
      if (bulkMessage.patientIds.length > 0) {
        payload.patientIds = bulkMessage.patientIds;
      }
      
      if (bulkMessage.groupFilter && bulkMessage.groupFilter !== "all") {
        payload.filters = { ...payload.filters, group: bulkMessage.groupFilter };
      }
      
      if (bulkMessage.doctorFilter) {
        payload.filters = { ...payload.filters, doctor: bulkMessage.doctorFilter };
      }
      
      if (bulkMessage.scheduledDate) {
        payload.scheduledFor = bulkMessage.scheduledDate.toISOString();
      }
      
      const response = await crudRequest<BulkSMSResponse>('POST', '/sms/bulk', payload);
      
      if (payload.scheduledFor) {
        toast.success(`Bulk SMS scheduled successfully! ${response.totalSent} messages will be sent at the scheduled time.`);
      } else {
        toast.success(`Bulk SMS sent successfully! Sent to ${response.totalSent} recipients`);
      }
      
      setBulkMessage({
        message: '',
        templateId: '',
        patientIds: [],
        groupFilter: '',
        doctorFilter: '',
        scheduledDate: undefined
      });
      setSelectedTemplate(null);
      
      // Refresh history
      fetchSMSHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send bulk SMS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle patient selection in bulk SMS
  const togglePatientSelection = (patientId: string) => {
    setBulkMessage(prev => {
      if (prev.patientIds.includes(patientId)) {
        return {
          ...prev,
          patientIds: prev.patientIds.filter(id => id !== patientId)
        };
      } else {
        return {
          ...prev,
          patientIds: [...prev.patientIds, patientId]
        };
      }
    });
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP p');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 max-w-6xl"
    >
      <h1 className="text-3xl font-bold mb-6">SMS Management</h1>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single SMS</TabsTrigger>
          <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
          <TabsTrigger value="history">SMS History</TabsTrigger>
        </TabsList>

        {/* Single SMS Tab */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Send Single SMS</CardTitle>
              <CardDescription>Send an SMS to a specific phone number</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleSMS} className="space-y-4">
                {/* Patient search */}
                <div className="space-y-2">
                  <Label htmlFor="patientSearch">Find Patient (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="patientSearch"
                      placeholder="Search for a patient..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={searchPatients}
                      disabled={patientsLoading}
                    >
                      {patientsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {patients.length > 0 && (
                    <div className="border rounded-md p-2 mt-2 max-h-40 overflow-y-auto">
                      {patients.map(patient => (
                        <div 
                          key={patient._id} 
                          className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.contactNumber}</p>
                          </div>
                          <Button variant="ghost" size="sm">Select</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Phone number input */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number (e.g., 9812345678 or +9779812345678)"
                    value={singleMessage.phoneNumber}
                    onChange={(e) => setSingleMessage(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                    pattern="^\+?[0-9]{10,15}$"
                    title="Please enter a valid Nepali phone number (10 digits starting with 98/97, or with country code +977)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a 10-digit Nepali number (e.g., 9812345678) or with country code (e.g., +9779812345678)
                  </p>
                </div>
                
                {/* Template selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="template">SMS Template (Optional)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowTemplateDialog(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> New Template
                    </Button>
                  </div>
                  <Select 
                    value={singleMessage.templateId} 
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Message content */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={singleMessage.message}
                    onChange={(e) => setSingleMessage(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-[100px]"
                  />
                  {selectedTemplate && selectedTemplate.variables.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Available variables: {selectedTemplate.variables.map(v => `{{${v}}}`).join(', ')}</p>
                    </div>
                  )}
                </div>
                
                {/* Schedule option */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Label htmlFor="schedule">Schedule for later?</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-[280px] justify-start text-left font-normal ${!singleMessage.scheduledDate && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {singleMessage.scheduledDate ? format(singleMessage.scheduledDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={singleMessage.scheduledDate}
                          onSelect={(date) => setSingleMessage(prev => ({ ...prev, scheduledDate: date || undefined }))}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {singleMessage.scheduledDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSingleMessage(prev => ({ ...prev, scheduledDate: undefined }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Submit button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : singleMessage.scheduledDate ? 'Schedule SMS' : 'Send SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk SMS Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk SMS</CardTitle>
              <CardDescription>Send an SMS to multiple patients</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkSMS} className="space-y-4">
                {/* Target Selection */}
                <div className="space-y-2">
                  <Label>Send To</Label>
                  <RadioGroup 
                    defaultValue="all" 
                    onValueChange={(value) => {
                      if (value === 'selected') {
                        setShowBulkSelection(true);
                      } else {
                        setShowBulkSelection(false);
                        setBulkMessage(prev => ({ ...prev, patientIds: [] }));
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all-patients" />
                      <Label htmlFor="all-patients">All Patients with Valid Phone Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="selected-patients" />
                      <Label htmlFor="selected-patients">Selected Patients</Label>
                    </div>
                  </RadioGroup>

                  {showBulkSelection && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulkPatientSearch">Search Patients</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bulkPatientSearch"
                            placeholder="Search for patients..."
                            value={searchPatient}
                            onChange={(e) => setSearchPatient(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={searchPatients}
                            disabled={patientsLoading}
                          >
                            {patientsLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {patients.length > 0 && (
                        <div className="border rounded-md p-2 mt-2 max-h-60 overflow-y-auto">
                          {patients.map(patient => (
                            <div 
                              key={patient._id} 
                              className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  id={`patient-${patient._id}`} 
                                  checked={bulkMessage.patientIds.includes(patient._id)}
                                  onCheckedChange={() => togglePatientSelection(patient._id)}
                                />
                                <div>
                                  <Label htmlFor={`patient-${patient._id}`} className="font-medium">{patient.name}</Label>
                                  <p className="text-sm text-muted-foreground">{patient.contactNumber}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {bulkMessage.patientIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <p className="w-full">Selected {bulkMessage.patientIds.length} patients</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Group Filter */}
                <div className="space-y-2">
                  <Label htmlFor="groupFilter">Filter by Group (Optional)</Label>
                  <Select 
                    value={bulkMessage.groupFilter} 
                    onValueChange={(value) => setBulkMessage(prev => ({ ...prev, groupFilter: value }))}
                  >
                    <SelectTrigger id="groupFilter">
                      <SelectValue placeholder="All Groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Ortho">Ortho</SelectItem>
                      <SelectItem value="Endo">Endo</SelectItem>
                      <SelectItem value="Perio">Perio</SelectItem>
                      <SelectItem value="Prostho">Prostho</SelectItem>
                      <SelectItem value="Surgery">Surgery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Template selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="bulkTemplate">SMS Template (Optional)</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowTemplateDialog(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> New Template
                    </Button>
                  </div>
                  <Select 
                    value={bulkMessage.templateId} 
                    onValueChange={handleBulkTemplateSelect}
                  >
                    <SelectTrigger id="bulkTemplate">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Message content */}
                <div className="space-y-2">
                  <Label htmlFor="bulkMessage">Message</Label>
                  <Textarea
                    id="bulkMessage"
                    placeholder="Enter your message here..."
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-[100px]"
                  />
                  {selectedTemplate && selectedTemplate.variables.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>Available variables: {selectedTemplate.variables.map(v => `{{${v}}}`).join(', ')}</p>
                      <p className="mt-1">System variables: {'{{name}}'} (patient name)</p>
                      </div>
                  )}
                </div>
                
                {/* Schedule option */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Label htmlFor="bulkSchedule">Schedule for later?</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-[280px] justify-start text-left font-normal ${!bulkMessage.scheduledDate && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bulkMessage.scheduledDate ? format(bulkMessage.scheduledDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={bulkMessage.scheduledDate}
                          onSelect={(date) => setBulkMessage(prev => ({ ...prev, scheduledDate: date || undefined }))}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {bulkMessage.scheduledDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setBulkMessage(prev => ({ ...prev, scheduledDate: undefined }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Submit button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Processing...' : bulkMessage.scheduledDate ? 'Schedule Bulk SMS' : 'Send Bulk SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>SMS History</CardTitle>
              <CardDescription>View the history of sent SMS messages</CardDescription>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchSMSHistory}
                disabled={historyLoading}
                className="mt-2"
              >
                {historyLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {smsHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No SMS history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smsHistory.map(item => (
                    <div key={item._id} className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">
                            To: {item.patient ? item.patient.personalDetails.name : 'Unknown'} ({item.recipient})
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Sent by: {item.sentBy?.name || 'System'} • {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <Badge className={
                          item.status === 'delivered' ? 'bg-green-500' :
                          item.status === 'sent' ? 'bg-blue-500' :
                          item.status === 'scheduled' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm whitespace-pre-wrap">{item.message}</p>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.templateUsed && (
                          <Badge variant="outline">Template: {item.templateUsed.name}</Badge>
                        )}
                        {item.scheduledFor && (
                          <Badge variant="outline">Scheduled: {formatDate(item.scheduledFor)}</Badge>
                        )}
                        {item.isBulk && (
                          <Badge variant="outline">Bulk SMS</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (historyPage > 1) {
                          setHistoryPage(prev => prev - 1);
                          fetchSMSHistory();
                        }
                      }}
                      disabled={historyPage === 1}
                      className="mx-1"
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setHistoryPage(prev => prev + 1);
                        fetchSMSHistory();
                      }}
                      disabled={smsHistory.length < 20}
                      className="mx-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create SMS Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for your SMS messages
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., Appointment Reminder"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateCategory">Category</Label>
              <Select 
                value={newTemplate.category} 
                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="templateCategory">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appointment">Appointment</SelectItem>
                  <SelectItem value="Reminder">Reminder</SelectItem>
                  <SelectItem value="Promotion">Promotion</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateContent">Content</Label>
              <Textarea
                id="templateContent"
                placeholder="Enter your template message here..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                required
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Use placeholders like {'{{name}}'} for variables that will be replaced when sending.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Variables (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {newTemplate.variables.map((variable, index) => (
                  <Badge key={index} className="flex items-center gap-1">
                    {variable}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setNewTemplate(prev => ({
                        ...prev,
                        variables: prev.variables.filter((_, i) => i !== index)
                      }))}
                    />
                  </Badge>
                ))}
                <div className="flex gap-2 w-full mt-2">
                  <Input
                    placeholder="Add a variable (e.g., name)"
                    value={newTemplate.variables.join(', ')}
                    onChange={(e) => setNewTemplate(prev => ({
                      ...prev,
                      variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleCreateTemplate}
              disabled={templateLoading || !newTemplate.name || !newTemplate.content}
            >
              {templateLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SMS; 