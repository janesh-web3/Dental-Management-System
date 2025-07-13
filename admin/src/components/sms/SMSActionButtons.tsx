import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageSquare, Bell, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { crudRequest } from '@/lib/api';

export function SMSActionButtons({ 
  patientId, 
  phoneNumber, 
  followUpDate,
  hasPaymentDue,
  onSuccess,
  className = ''
}: {
  patientId: string;
  patientName: string;
  phoneNumber?: string;
  followUpDate?: string;
  hasPaymentDue?: boolean;
  onSuccess?: () => void;
  className?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendSMS = async (type: 'followup' | 'payment') => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'No phone number available for this patient.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(type);
    
    try {
      const endpoint = type === 'followup' 
        ? `/api/sms/followup/${patientId}`
        : `/api/sms/payment-due/${patientId}`;
      
      const response = await crudRequest(
        'POST',
        endpoint
      );

      if (response && typeof response === 'object' && 'success' in response) {
        toast({
          title: 'Success',
          description: `SMS ${type === 'followup' ? 'follow-up' : 'payment reminder'} sent successfully.`,
        });
        onSuccess?.();
      } else {
        throw new Error((response as any)?.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error(`Error sending ${type} SMS:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const isFollowUpDisabled = !followUpDate || loading === 'followup';
  const isPaymentDisabled = !hasPaymentDue || loading === 'payment';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleSendSMS('followup')}
          disabled={isFollowUpDisabled}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Send Follow-up SMS</span>
          {loading === 'followup' && <span className="ml-2 animate-spin">↻</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSendSMS('payment')}
          disabled={isPaymentDisabled}
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>Send Payment Reminder</span>
          {loading === 'payment' && <span className="ml-2 animate-spin">↻</span>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2"
          onClick={() => {
            // This would open a modal or navigate to the single SMS page
            // with the patient pre-selected
            console.log('Open single SMS with patient:', patientId);
          }}
        >
          <Bell className="h-4 w-4" />
          <span>Send Custom SMS</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
