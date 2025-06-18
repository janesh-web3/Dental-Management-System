import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileUp } from "lucide-react";
import { TreatmentFileUpload } from "./TreatmentFileUpload";

interface PatientDocumentUploadButtonProps {
  patientId: string;
  medicalDetailId?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onSuccess?: (updatedPatient: any) => void;
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

export function PatientDocumentUploadButton({
  patientId,
  medicalDetailId = "",
  variant = "outline",
  size = "default",
  onSuccess,
  className = "",
  children,
  id
}: PatientDocumentUploadButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        id={id}
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
        className={className}
      >
        {children || (
          <>
            <FileUp className="h-4 w-4 mr-2" />
            Upload Documents
          </>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Prevent this from immediately triggering parent onClick handlers
          setTimeout(() => {
            setIsDialogOpen(false);
          }, 100);
        } else {
          setIsDialogOpen(true);
        }
      }}>
        <DialogContent 
          onClick={(e) => e.stopPropagation()}
          className="sm:max-w-[600px]">
          <TreatmentFileUpload
            patientId={patientId}
            medicalDetailId={medicalDetailId}
            treatmentId="general" // Using "general" for general patient documents
            onClose={() => setIsDialogOpen(false)}
            onSuccess={(updatedPatient) => {
              if (onSuccess) onSuccess(updatedPatient);
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 