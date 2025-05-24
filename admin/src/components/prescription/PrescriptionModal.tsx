
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { PrescriptionForm } from "./PrescriptionForm";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  patientData?: {
    contactNumber?: string;
    emailAddress?: string;
    age?: string;
    gender?: string;
    address?: string;
  };
  doctorId?: string;
  doctorName?: string;
  isAdmin?: boolean;
}

export function PrescriptionModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientData,
  doctorId,
  doctorName,
  isAdmin = false,
}: PrescriptionModalProps) {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          /* Base styles for all devices */
          "w-full p-0 rounded-lg shadow-lg",
          /* Mobile: Full width with max height and scrolling */
          "h-[90vh] max-h-[90vh] overflow-y-auto",
          /* Tablet: Limited width, centered */
          "md:max-w-2xl md:h-auto md:max-h-[85vh]",
          /* Desktop: Wider with appropriate height */
          "lg:max-w-3xl xl:max-w-4xl"
        )}
      >
        <DialogHeader className="sticky top-0 z-10 bg-background px-4 py-4 sm:px-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {patientName ? `Prescription for ${patientName}` : "New Prescription"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Fill in the prescription details below
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                aria-label="Close prescription form"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 py-4 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <PrescriptionForm
                  patientId={patientId}
                  patientName={patientName}
                  patientData={patientData}
                  doctorId={doctorId}
                  doctorName={doctorName}
                  isAdmin={isAdmin}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
