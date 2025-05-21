import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { updateDoctorPassword } from "@/utils/auth";
import { Doctor } from "@/types/doctor";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  doctor,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    // Basic password strength check
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const score = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars, isLongEnough].filter(Boolean).length;
    
    if (score <= 2) setPasswordStrength('weak');
    else if (score <= 4) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the simulated API to update the password
      const response = await updateDoctorPassword(doctor._id, password);
      
      if (response.success) {
        toast.success("Password updated successfully");
        onClose();
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error) {
      toast.error("Failed to update password");
      console.error("Error updating password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password for {doctor.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
              minLength={6}
            />
            {passwordStrength && (
              <div className="mt-1">
                <div className="text-xs">
                  Password strength: 
                  <span className={`font-medium ml-1 ${
                    passwordStrength === 'weak' ? 'text-red-500' : 
                    passwordStrength === 'medium' ? 'text-yellow-500' : 
                    'text-green-500'
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-200 mt-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      passwordStrength === 'weak' ? 'w-1/3 bg-red-500' : 
                      passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' : 
                      'w-full bg-green-500'
                    }`}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">Must be at least 6 characters</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || password !== confirmPassword || password.length < 6}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
