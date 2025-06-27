import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';
import { MessageCircle, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SMSButtonProps {
  patientId: string;
  patientName: string;
  contactNumber: string;
  type: 'followup' | 'payment' | 'custom';
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const SMSButton = ({
  patientId,
  patientName,
  contactNumber,
  type,
  disabled = false,
  className = '',
  size = 'sm',
  variant = 'outline'
}: SMSButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getButtonText = () => {
    switch (type) {
      case 'followup':
        return 'Send Follow-up SMS';
      case 'payment':
        return 'Send Payment Reminder';
      case 'custom':
        return 'Send Custom SMS';
      default:
        return 'Send SMS';
    }
  };
  
  const getDefaultMessage = () => {
    switch (type) {
      case 'followup':
        return `Dear ${patientName}, this is a reminder about your upcoming follow-up appointment. Please call us if you need to reschedule.`;
      case 'payment':
        return `Dear ${patientName}, this is a reminder about your pending payment. Please clear your dues at your earliest convenience.`;
      case 'custom':
        return `Dear ${patientName},`;
      default:
        return '';
    }
  };
  
  const handleOpenDialog = () => {
    setMessage(getDefaultMessage());
    setError(null);
    setIsDialogOpen(true);
  };
  
  const handleSendSMS = async () => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    if (!contactNumber) {
      setError('Patient does not have a valid contact number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      
      switch (type) {
        case 'followup':
          endpoint = `/sms/followup/${patientId}`;
          break;
        case 'payment':
          endpoint = `/sms/payment-due/${patientId}`;
          break;
        case 'custom':
          endpoint = '/sms/single';
          break;
        default:
          throw new Error('Invalid SMS type');
      }
      
      let payload: any = {};
      
      if (type === 'custom') {
        payload = {
          phoneNumber: contactNumber,
          message,
          patientId
        };
      }
      
      const response = await crudRequest<{ success: boolean; message?: string; error?: string }>('POST', endpoint, payload);
      
      if (response.success) {
        toast.success('SMS sent successfully');
        setIsDialogOpen(false);
      } else {
        setError(response.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      setError(error.response?.data?.error || error.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };
  
  const getDialogTitle = () => {
    switch (type) {
      case 'followup':
        return 'Send Follow-up Reminder';
      case 'payment':
        return 'Send Payment Reminder';
      case 'custom':
        return 'Send Custom SMS';
      default:
        return 'Send SMS';
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={disabled || !contactNumber}
        className={className}
        title={contactNumber ? getButtonText() : 'Patient has no contact number'}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        {size !== 'icon' && getButtonText()}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              Send an SMS to {patientName} at {contactNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">
                {message.length} characters ({Math.ceil(message.length / 160)} SMS units)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSendSMS} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SMSButton;
