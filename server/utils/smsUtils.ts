import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const AAKASH_SMS_URL = 'https://sms.aakashsms.com/sms/v3/send';
const AAKASH_SMS_BULK_URL = 'https://sms.aakashsms.com/sms/v4/send-user';
const AAKASH_CREDIT_URL = 'https://sms.aakashsms.com/sms/v4/available-credit';

interface SMSResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export const sendSingleSMS = async (phoneNumber: string, message: string): Promise<SMSResponse> => {
  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) {
      return { status: 'error', message: 'Invalid phone number format' };
    }

    const response = await axios.post(AAKASH_SMS_URL, {
      auth_token: process.env.AAKASH_SMS_TOKEN,
      to: formattedNumber,
      text: message
    });

    return {
      status: 'success',
      message: 'SMS sent successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to send SMS'
    };
  }
};

export const sendBulkSMS = async (phoneNumbers: string[], messages: string[]): Promise<SMSResponse> => {
  try {
    if (phoneNumbers.length !== messages.length) {
      return { status: 'error', message: 'Phone numbers and messages count must match' };
    }

    const formattedNumbers = phoneNumbers.map(formatPhoneNumber);
    if (formattedNumbers.some(num => !num)) {
      return { status: 'error', message: 'One or more phone numbers are invalid' };
    }

    const response = await axios.post(
      AAKASH_SMS_BULK_URL,
      {
        to: formattedNumbers,
        text: messages
      },
      {
        headers: {
          'auth-token': process.env.AAKASH_SMS_TOKEN || ''
        }
      }
    );

    return {
      status: 'success',
      message: 'Bulk SMS sent successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('Error sending bulk SMS:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to send bulk SMS'
    };
  }
};

export const checkSMSCredit = async (): Promise<number | null> => {
  try {
    const response = await axios.get(AAKASH_CREDIT_URL, {
      headers: {
        'auth-token': process.env.AAKASH_SMS_TOKEN || ''
      }
    });
    return response.data.credit || null;
  } catch (error) {
    console.error('Error checking SMS credit:', error);
    return null;
  }
};

const formatPhoneNumber = (phone: string): string | null => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid 10-digit number
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  // Check if it's a number with country code (e.g., 97798...)
  if (cleaned.length === 12 || cleaned.length === 13) {
    return cleaned.slice(-10);
  }
  
  return null;
};
