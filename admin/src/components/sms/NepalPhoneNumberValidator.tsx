import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NepalPhoneNumberValidatorProps {
  phoneNumber: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const NepalPhoneNumberValidator: React.FC<NepalPhoneNumberValidatorProps> = ({
  phoneNumber,
  onPhoneNumberChange,
  label = "Phone Number",
  placeholder = "Enter phone number (e.g., 98XXXXXXXX)",
  required = false
}) => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | null;
  }>({ isValid: false, message: '', type: null });

  // Format phone number for display
  const formatPhoneNumber = (number: string): string => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // If it's a valid 10-digit Nepali number, format it
    if (cleaned.match(/^9[678]\d{8}$/)) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return cleaned;
  };

  // Validate Nepali phone number
  const validateNepalPhoneNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Check for different formats
    if (cleaned === '') {
      setValidationResult({
        isValid: !required,
        message: required ? 'Phone number is required' : '',
        type: required ? 'error' : null
      });
      return;
    }
    
    // Check if it's a valid 10-digit Nepali number (98/97 prefix)
    if (cleaned.match(/^9[678]\d{8}$/)) {
      setValidationResult({
        isValid: true,
        message: 'Valid Nepali mobile number',
        type: 'success'
      });
      return;
    }
    
    // Check if it has Nepal country code (+977 or 977)
    if (cleaned.startsWith('977') && cleaned.length === 13) {
      const withoutCountryCode = cleaned.substring(3);
      if (withoutCountryCode.match(/^9[678]\d{8}$/)) {
        setValidationResult({
          isValid: true,
          message: 'Valid Nepali mobile number with country code',
          type: 'success'
        });
        // Update the phone number to remove country code
        onPhoneNumberChange(withoutCountryCode);
        return;
      }
    }
    
    if (cleaned.startsWith('+977') && cleaned.length === 14) {
      const withoutCountryCode = cleaned.substring(4);
      if (withoutCountryCode.match(/^9[678]\d{8}$/)) {
        setValidationResult({
          isValid: true,
          message: 'Valid Nepali mobile number with country code',
          type: 'success'
        });
        // Update the phone number to remove country code
        onPhoneNumberChange(withoutCountryCode);
        return;
      }
    }
    
    // Check if it's too short
    if (cleaned.length < 10) {
      setValidationResult({
        isValid: false,
        message: 'Phone number is too short. Should be 10 digits for Nepali numbers.',
        type: 'error'
      });
      return;
    }
    
    // Check if it's too long
    if (cleaned.length > 10) {
      setValidationResult({
        isValid: false,
        message: 'Phone number is too long. Should be 10 digits for Nepali numbers.',
        type: 'error'
      });
      return;
    }
    
    // Check if it doesn't start with 98/97
    if (!cleaned.match(/^9[678]/)) {
      setValidationResult({
        isValid: false,
        message: 'Nepali mobile numbers should start with 98, 97, or 96.',
        type: 'error'
      });
      return;
    }
    
    // Generic invalid format
    setValidationResult({
      isValid: false,
      message: 'Invalid phone number format. Please use 10-digit format (e.g., 98XXXXXXXX).',
      type: 'error'
    });
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onPhoneNumberChange(value);
    validateNepalPhoneNumber(value);
  };

  // Get validation icon
  const getValidationIcon = () => {
    switch (validationResult.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone-number">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="phone-number"
          type="tel"
          value={formatPhoneNumber(phoneNumber)}
          onChange={handleChange}
          placeholder={placeholder}
          className={validationResult.type === 'error' ? 'border-red-500' : ''}
        />
        {validationResult.type && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {getValidationIcon()}
          </div>
        )}
      </div>
      {validationResult.message && (
        <Alert variant={validationResult.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription className="flex items-center">
            {getValidationIcon()}
            <span className="ml-2">{validationResult.message}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NepalPhoneNumberValidator;