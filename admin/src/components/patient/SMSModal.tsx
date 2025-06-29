import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";
import { crudRequest } from "@/lib/api";

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

const SMSModal = ({ isOpen, onClose, patient }: SMSModalProps) => {
  const [selectedTab, setSelectedTab] = useState("payment");
  const [paymentMessage, setPaymentMessage] = useState(
    `Dear ${patient.personalDetails.name}, this is a reminder that you have a pending payment for your dental treatment. Please clear your dues at your earliest convenience. Thank you. - Crown Dental Clinic`
  );
  const [followupMessage, setFollowupMessage] = useState(
    `Dear ${patient.personalDetails.name}, this is a reminder about your upcoming follow-up dental appointment. Please visit on schedule. Thank you. - Crown Dental Clinic`
  );
  const [isSending, setIsSending] = useState(false);

  const handleSendSMS = async () => {
    if (!patient.personalDetails.contactNumber) {
      toast.error("Patient does not have a contact number");
      return;
    }

    setIsSending(true);
    try {
      const message = selectedTab === "payment" ? paymentMessage : followupMessage;
      const endpoint = selectedTab === "payment" 
        ? `/sms/payment-due/${patient._id}` 
        : `/sms/followup/${patient._id}`;

      const response = await crudRequest<{success: boolean, message: string}>("POST", endpoint, {
        customMessage: message
      });

      if (response && response.success) {
        toast.success(`${selectedTab === "payment" ? "Payment" : "Follow-up"} reminder SMS sent successfully`);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send SMS ({patient.personalDetails.name})</DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="payment" 
          className="mt-4"
          value={selectedTab}
          onValueChange={setSelectedTab}
        >
          <TabsList className="w-full">
            <TabsTrigger value="payment" className="flex-1">Payment Reminder</TabsTrigger>
            <TabsTrigger value="followup" className="flex-1">Follow-up Reminder</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment" className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Send a payment reminder SMS to this patient. The phone number that will be used is: <span className="font-medium">{patient.personalDetails.contactNumber || "No contact number available"}</span>
              </p>
              
              <Textarea 
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                placeholder="Enter payment reminder message"
                className="min-h-[150px] font-mono text-sm"
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                Customize the message as needed. Standard SMS rates apply.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="followup" className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Send a follow-up appointment reminder SMS to this patient. The phone number that will be used is: <span className="font-medium">{patient.personalDetails.contactNumber || "No contact number available"}</span>
              </p>
              
              <Textarea 
                value={followupMessage}
                onChange={(e) => setFollowupMessage(e.target.value)}
                placeholder="Enter follow-up reminder message"
                className="min-h-[150px] font-mono text-sm"
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                Customize the message as needed. Standard SMS rates apply.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendSMS} 
            disabled={isSending || !patient.personalDetails.contactNumber}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SMSModal;
