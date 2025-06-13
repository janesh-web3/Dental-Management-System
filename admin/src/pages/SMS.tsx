import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';

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

const SMS = () => {
  const [singleMessage, setSingleMessage] = useState({
    phoneNumber: '',
    message: ''
  });
  const [bulkMessage, setBulkMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format the phone number before sending
      const formattedNumber = formatPhoneNumber(singleMessage.phoneNumber);
      
      const response = await crudRequest<SMSResponse>('POST', '/sms/single', {
        ...singleMessage,
        phoneNumber: formattedNumber
      });

      console.log(response);
      
      toast.success('SMS sent successfully!');
      
      setSingleMessage({ phoneNumber: '', message: '' });
    } catch (error: any) {
      // Show more detailed error message
      const errorMessage = error.response?.data?.error || 'Failed to send SMS';
      toast.error(errorMessage);
      
      console.error('SMS Error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await crudRequest<BulkSMSResponse>('POST', '/sms/bulk', { message: bulkMessage });
      toast.success(`Bulk SMS sent successfully! Sent to ${response.totalSent} recipients`);
      setBulkMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send bulk SMS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 max-w-4xl"
    >
      <h1 className="text-3xl font-bold mb-6">SMS Management</h1>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single SMS</TabsTrigger>
          <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Send Single SMS</CardTitle>
              <CardDescription>Send an SMS to a specific phone number</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleSMS} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone Number
                  </label>
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
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={singleMessage.message}
                    onChange={(e) => setSingleMessage(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk SMS</CardTitle>
              <CardDescription>Send an SMS to all patients with phone numbers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkSMS} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bulkMessage" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="bulkMessage"
                    placeholder="Enter your message here..."
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Bulk SMS'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SMS; 