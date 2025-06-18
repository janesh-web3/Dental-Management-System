import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { PrescriptionModal } from "./PrescriptionModal";

interface AddPrescriptionButtonProps {
  id?: string;
  patientId: string;
  patientName: string;
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
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddPrescriptionButton({
  id,
  patientId,
  patientName,
  patientData,
  doctorId,
  doctorName,
  isAdmin = false,
  variant = "outline",
  size = "sm",
}: AddPrescriptionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Button
        id={id}
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          openModal();
        }}
        className="flex items-center gap-1"
      >
        <FilePlus className="h-4 w-4" />
        Add Prescription
      </Button>

      <PrescriptionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        patientId={patientId}
        patientName={patientName}
        patientData={patientData}
        doctorId={doctorId}
        doctorName={doctorName}
        isAdmin={isAdmin}
      />
    </>
  );
}
