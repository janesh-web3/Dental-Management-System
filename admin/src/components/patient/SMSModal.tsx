import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Send, Check, Calendar, Users, AlertCircle, DollarSign, MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { dentalName } from "@/server";

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    _id: string;
    personalDetails: {
      name: string;
      contactNumber: string;
      emailAddress: string;
    };
  };
}

type FollowUpPatient = {
  _id: string;
  name: string;
  contactNumber: string;
  nextFollowUpDate: string;
  selected?: boolean;
};

const SMSModal = ({ isOpen, onClose, patient }: SMSModalProps) => {
  const [selectedTab, setSelectedTab] = useState("custom"); // Default to custom tab
  const [paymentMessage, setPaymentMessage] = useState(
    `Dear ${patient.personalDetails.name}, this is a reminder that you have a pending payment for your dental treatment. Please clear your dues at your earliest convenience. Thank you. - ${dentalName}`
  );
  const [followupMessage, setFollowupMessage] = useState("");
  const [customMessage, setCustomMessage] = useState(
    `Dear ${patient.personalDetails.name}, `
  );
  const [isSending, setIsSending] = useState(false);
  const [followUpPatients, setFollowUpPatients] = useState<FollowUpPatient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState("upcoming");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [bulkFollowupMessage, setBulkFollowupMessage] = useState(
    `Dear {{name}}, this is a reminder about your follow-up dental appointment on {{date}}. Please visit on schedule. Thank you. - ${dentalName}`
  );
  const [view, setView] = useState<"single" | "bulk">("single");
  const [patientFollowUpDate, setPatientFollowUpDate] = useState<Date | null>(null);
  const [isLoadingSinglePatient, setIsLoadingSinglePatient] = useState(false);
  const [hasFollowUpDate, setHasFollowUpDate] = useState<boolean | null>(null);
  const [hasPendingPayment, setHasPendingPayment] = useState<boolean | null>(null);
  const [isLoadingPaymentInfo, setIsLoadingPaymentInfo] = useState(false);
  const [totalRemainingAmount, setTotalRemainingAmount] = useState<number>(0);

  // Fetch the patient's payment info when the modal opens
  useEffect(() => {
    if (isOpen && patient._id) {
      fetchPatientPaymentInfo(patient._id);
      if (selectedTab === "followup" || hasFollowUpDate === null) {
        fetchPatientFollowUpDate(patient._id);
      }
    }
  }, [isOpen, patient._id]);

  // When tab changes to follow-up and no follow-up date found, or to payment and no pending payment, switch to other tab
  useEffect(() => {
    if (hasFollowUpDate === false && selectedTab === "followup") {
      // If no follow-up date, automatically switch to payment tab if payment is available
      if (hasPendingPayment === true) {
        setSelectedTab("payment");
        toast.info("This patient has no follow-up dates scheduled. Payment reminder option selected instead.", {
          autoClose: 3000,
        });
      } else {
        // If no follow-up date and no pending payment, switch to custom message
        setSelectedTab("custom");
        toast.info("This patient has no follow-up dates. Custom message option selected.", {
          autoClose: 3000,
        });
      }
    }

    if (hasPendingPayment === false && selectedTab === "payment") {
      // If no pending payment, automatically switch to follow-up tab if follow-up is available
      if (hasFollowUpDate === true) {
        setSelectedTab("followup");
        toast.info("This patient has no pending payments. Follow-up reminder option selected instead.", {
          autoClose: 3000,
        });
      } else {
        // If no pending payment and no follow-up date, switch to custom message
        setSelectedTab("custom");
        toast.info("This patient has no pending payments. Custom message option selected.", {
          autoClose: 3000,
        });
      }
    }

    // If both options are not available, show a notice but don't change tab if it's already custom
    if (hasFollowUpDate === false && hasPendingPayment === false && selectedTab !== "custom") {
      toast.info("This patient has no follow-up dates or pending payments. Custom message option is available.", {
        autoClose: 5000,
      });
      setSelectedTab("custom");
    }
  }, [hasFollowUpDate, hasPendingPayment, selectedTab]);

  // Update follow-up message when the follow-up date changes
  useEffect(() => {
    if (patientFollowUpDate) {
      const formattedDate = formatFollowUpDateForMessage(patientFollowUpDate);
      setFollowupMessage(
        `Dear ${patient.personalDetails.name}, this is a reminder about your follow-up dental appointment on ${formattedDate}. Please visit on schedule. Thank you. - Crown Dental Clinic`
      );
      setHasFollowUpDate(true);
    } else {
      setFollowupMessage(
        `Dear ${patient.personalDetails.name}, this is a reminder about your upcoming dental appointment. Please visit on schedule. Thank you. - Crown Dental Clinic`
      );
    }
  }, [patient.personalDetails.name, patientFollowUpDate]);

  // Format date for message display
  const formatFollowUpDateForMessage = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch the patient's upcoming follow-up date
  const fetchPatientFollowUpDate = async (patientId: string) => {
    setIsLoadingSinglePatient(true);
    try {
      const response = await crudRequest<{
        success: boolean;
        data?: {
          nextFollowUpDate?: string;
        }
      }>("GET", `/patient/${patientId}/next-followup`);

      if (response && response.success && response.data?.nextFollowUpDate) {
        setPatientFollowUpDate(new Date(response.data.nextFollowUpDate));
        setHasFollowUpDate(true);
      } else {
        // If no follow-up date is found, set to null
        setPatientFollowUpDate(null);
        setHasFollowUpDate(false);
      }
    } catch (error) {
      console.error("Error fetching patient follow-up date:", error);
      setPatientFollowUpDate(null);
      setHasFollowUpDate(false);
    } finally {
      setIsLoadingSinglePatient(false);
    }
  };

  // Fetch the patient's payment information
  const fetchPatientPaymentInfo = async (patientId: string) => {
    setIsLoadingPaymentInfo(true);
    try {
      const response = await crudRequest<{
        success: boolean;
        data?: {
          totalRemainingAmount: number;
          hasPendingPayment: boolean;
        }
      }>("GET", `/patient/${patientId}/payment-info`);

      if (response && response.success) {
        setTotalRemainingAmount(response.data?.totalRemainingAmount || 0);
        setHasPendingPayment(response.data?.hasPendingPayment || false);
        
        // Update payment message with actual amount if there's a pending payment
        if (response.data?.hasPendingPayment && response.data?.totalRemainingAmount > 0) {
          setPaymentMessage(
            `Dear ${patient.personalDetails.name}, this is a reminder that you have a pending payment of Rs ${response.data.totalRemainingAmount} for your dental treatment. Please clear your dues at your earliest convenience. Thank you. - ${dentalName}`
          );
        }
      } else {
        // Default to assuming no pending payment if we can't fetch the data
        setHasPendingPayment(false);
        setTotalRemainingAmount(0);
      }
    } catch (error) {
      console.error("Error fetching patient payment info:", error);
      setHasPendingPayment(false);
      setTotalRemainingAmount(0);
    } finally {
      setIsLoadingPaymentInfo(false);
    }
  };

  // Fetch patients with follow-up dates when the modal is opened
  useEffect(() => {
    if (isOpen && selectedTab === "followup" && view === "bulk") {
      fetchFollowUpPatients();
    }
  }, [isOpen, selectedTab, followUpFilter, view]);

  const fetchFollowUpPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const response = await crudRequest<{
        success: boolean;
        data: {
          patients: FollowUpPatient[];
          total: number;
        }
      }>("GET", `/sms/patients-with-followup?filter=${followUpFilter}`);

      if (response && response.success && response.data.patients) {
        setFollowUpPatients(response.data.patients.map(p => ({
          ...p,
          selected: false
        })));
      } else {
        toast.error("Failed to fetch patients with follow-up dates");
      }
    } catch (error) {
      console.error("Error fetching patients with follow-up dates:", error);
      toast.error("Error loading patients with follow-up dates");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSendSMS = async () => {
    if (!patient.personalDetails.contactNumber) {
      toast.error("Patient does not have a contact number");
      return;
    }

    setIsSending(true);
    try {
      let message;
      let endpoint;

      // Determine message and endpoint based on selected tab
      if (selectedTab === "payment") {
        message = paymentMessage;
        endpoint = `/sms/payment-due/${patient._id}`;
      } else if (selectedTab === "followup") {
        message = followupMessage;
        endpoint = `/sms/followup/${patient._id}`;
      } else {
        // Custom message
        message = customMessage;
        endpoint = `/sms/custom/${patient._id}`;
      }
        
      const response = await crudRequest<{success: boolean, message: string}>("POST", endpoint, { 
        customMessage: message 
      });

      if (response && response.success) {
        let successMessage;
        if (selectedTab === "payment") {
          successMessage = "Payment reminder SMS sent successfully";
        } else if (selectedTab === "followup") {
          successMessage = "Follow-up reminder SMS sent successfully";
        } else {
          successMessage = "Custom SMS sent successfully";
        }
        toast.success(successMessage);
        onClose();
      } else {
        toast.error(`Failed to send SMS: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulkFollowUp = async () => {
    if (selectedPatients.length === 0) {
      toast.error("Please select at least one patient");
      return;
    }

    setIsSending(true);
    try {
      const response = await crudRequest<{success: boolean, message?: string}>("POST", "/sms/bulk-followup", {
        patientIds: selectedPatients,
        customMessage: bulkFollowupMessage
      });

      if (response && response.success) {
        toast.success(`Follow-up reminders sent to ${selectedPatients.length} patients`);
        onClose();
      } else {
        toast.error(`Failed to send SMS: ${response?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending bulk SMS:", error);
      toast.error("Failed to send bulk SMS. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const togglePatientSelection = (patientId: string) => {
    setFollowUpPatients(prev => 
      prev.map(p => p._id === patientId ? { ...p, selected: !p.selected } : p)
    );
    
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  const toggleAllPatients = (selected: boolean) => {
    setFollowUpPatients(prev => 
      prev.map(p => ({ ...p, selected }))
    );
    
    setSelectedPatients(selected ? followUpPatients.map(p => p._id) : []);
  };

  const formatFollowUpDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PP');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send SMS ({patient.personalDetails.name})</DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="custom" 
          className="mt-4"
          value={selectedTab}
          onValueChange={(value) => {
            if (value === "followup" && hasFollowUpDate === false) {
              toast.warning("This patient has no follow-up dates scheduled.");
              return;
            }
            if (value === "payment" && hasPendingPayment === false) {
              toast.warning("This patient has no pending payments.");
              return;
            }
            setSelectedTab(value);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger 
              value="payment" 
              className="flex-1 relative"
              disabled={hasPendingPayment === false}
            >
              Payment Reminder
              {hasPendingPayment === false && (
                <span className="absolute -top-1 -right-1 text-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="followup" 
              className="flex-1 relative"
              disabled={hasFollowUpDate === false}
            >
              Follow-up Reminder
              {hasFollowUpDate === false && (
                <span className="absolute -top-1 -right-1 text-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="custom" 
              className="flex-1"
            >
              Custom Message
            </TabsTrigger>
          </TabsList>
          
          {/* Payment Tab Content */}
          <TabsContent value="payment" className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Send a payment reminder SMS to this patient. The phone number that will be used is: <span className="font-medium">{patient.personalDetails.contactNumber || "No contact number available"}</span>
              </p>
              
              {isLoadingPaymentInfo ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Loading payment information...</span>
                </div>
              ) : hasPendingPayment === false ? (
                <div className="mb-2 flex items-center p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                  <div>
                    <p className="font-medium">No pending payments</p>
                    <p className="text-sm mt-1">This patient doesn't have any pending payments. Payment reminders are not applicable.</p>
                  </div>
                </div>
              ) : (
                <div className="mb-2 flex items-center p-3 rounded-md bg-green-50 border border-green-200">
                  <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-green-800">Pending Payment</p>
                    <p className="text-sm text-green-700">Rs {totalRemainingAmount} remaining</p>
                  </div>
                </div>
              )}
              
              <Textarea 
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                placeholder="Enter payment reminder message"
                className="min-h-[150px] font-mono text-sm"
                disabled={hasPendingPayment === false}
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                {hasPendingPayment
                  ? "Customize the message as needed. Standard SMS rates apply."
                  : "Payment reminders can only be sent to patients with pending payments."}
              </p>
            </div>
          </TabsContent>
          
          {/* Follow-up Tab Content */}
          <TabsContent value="followup" className="space-y-4 py-4">
            <div className="flex gap-2 mb-4">
              <Button 
                variant={view === "single" ? "default" : "outline"} 
                size="sm"
                onClick={() => setView("single")}
                className="flex gap-2"
              >
                <Send className="h-4 w-4" />
                Single Patient
              </Button>
              <Button 
                variant={view === "bulk" ? "default" : "outline"} 
                size="sm"
                onClick={() => setView("bulk")}
                className="flex gap-2"
              >
                <Users className="h-4 w-4" />
                Bulk Reminders
              </Button>
            </div>

            {view === "single" ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Send a follow-up appointment reminder SMS to this patient. The phone number that will be used is: <span className="font-medium">{patient.personalDetails.contactNumber || "No contact number available"}</span>
                </p>
                
                {isLoadingSinglePatient ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Loading follow-up information...</span>
                  </div>
                ) : hasFollowUpDate === false ? (
                  <div className="mb-2 flex items-center p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                    <div>
                      <p className="font-medium">No follow-up date found</p>
                      <p className="text-sm mt-1">This patient doesn't have any scheduled follow-up appointments. Please schedule a follow-up first or use the payment reminder option.</p>
                    </div>
                  </div>
                ) : patientFollowUpDate ? (
                  <div className="mb-2 flex items-center p-3 rounded-md bg-green-50 border border-green-200">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">Follow-up scheduled</p>
                      <p className="text-sm text-green-700">{formatFollowUpDateForMessage(patientFollowUpDate)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 flex items-center text-amber-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">No specific follow-up date found</span>
                  </div>
                )}
                
                <Textarea 
                  value={followupMessage}
                  onChange={(e) => setFollowupMessage(e.target.value)}
                  placeholder="Enter follow-up reminder message"
                  className="min-h-[150px] font-mono text-sm"
                  disabled={hasFollowUpDate === false}
                />
                
                <p className="text-xs text-muted-foreground mt-2">
                  {hasFollowUpDate 
                    ? "Customize the message as needed. Standard SMS rates apply."
                    : "Follow-up reminders can only be sent to patients with scheduled follow-up dates."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Patients with Follow-up Dates</h3>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={followUpFilter} 
                      onValueChange={setFollowUpFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter follow-ups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="upcoming">All Upcoming</SelectItem>
                        <SelectItem value="all">All Dates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <ScrollArea className="h-[200px] border rounded-md">
                  {isLoadingPatients ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : followUpPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                      <Calendar className="h-10 w-10 mb-2 opacity-20" />
                      <p>No patients with follow-up dates found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox 
                              checked={selectedPatients.length === followUpPatients.length && followUpPatients.length > 0}
                              onCheckedChange={(checked) => {
                                toggleAllPatients(checked === true);
                              }}
                            />
                          </TableHead>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>Follow-up Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followUpPatients.map((patient) => (
                          <TableRow key={patient._id} className="cursor-pointer hover:bg-muted/50" onClick={() => togglePatientSelection(patient._id)}>
                            <TableCell>
                              <Checkbox 
                                checked={patient.selected}
                                onCheckedChange={() => togglePatientSelection(patient._id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200">
                                {formatFollowUpDate(patient.nextFollowUpDate)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium">Message Template</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedPatients.length} patients selected
                    </p>
                  </div>
                  
                  <Textarea 
                    value={bulkFollowupMessage}
                    onChange={(e) => setBulkFollowupMessage(e.target.value)}
                    placeholder="Enter follow-up reminder message template"
                    className="min-h-[100px] font-mono text-sm"
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 py-0.5 rounded">{'{{name}}'}</code> for patient name and <code className="bg-muted px-1 py-0.5 rounded">{'{{date}}'}</code> for follow-up date.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Custom Message Tab Content */}
          <TabsContent value="custom" className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Send a custom SMS to this patient. The phone number that will be used is: <span className="font-medium">{patient.personalDetails.contactNumber || "No contact number available"}</span>
              </p>
              
              <div className="mb-2 flex items-center p-3 rounded-md bg-blue-50 border border-blue-200">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-800">Custom Message</p>
                  <p className="text-sm text-blue-700">Send a personalized message to this patient</p>
                </div>
              </div>
              
              <Textarea 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message"
                className="min-h-[150px] font-mono text-sm"
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                Customize your message as needed. Standard SMS rates apply.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          {selectedTab === "followup" && view === "bulk" ? (
            <Button 
              onClick={handleSendBulkFollowUp} 
              disabled={isSending || selectedPatients.length === 0}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to {selectedPatients.length} Patient{selectedPatients.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleSendSMS} 
              disabled={
                isSending || 
                !patient.personalDetails.contactNumber || 
                (selectedTab === "followup" && hasFollowUpDate === false) ||
                (selectedTab === "payment" && hasPendingPayment === false) ||
                (selectedTab === "custom" && !customMessage.trim())
              }
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send SMS
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SMSModal;
