import { useState } from "react";
import { MoreHorizontal, FilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AddPrescriptionButton } from "../AddPrescriptionButton";
import { PrescriptionModal } from "../PrescriptionModal";

// This is an example of how to integrate the prescription functionality
// in the Admin Panel's patient table

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function PatientTableRowActions({ patient }: { patient: Patient }) {
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsPrescriptionModalOpen(true)}
            className="cursor-pointer"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Add Prescription
          </DropdownMenuItem>
          {/* Other dropdown items */}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Option 1: Using the modal directly */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patientId={patient._id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        isAdmin={true}
      />
    </>
  );
}

// Example of patient table cell with direct button
export function PatientTableCell({ patient }: { patient: Patient }) {
  return (
    <div className="flex items-center space-x-2">
      <div>
        <div className="font-medium">
          {patient.firstName} {patient.lastName}
        </div>
        <div className="text-sm text-muted-foreground">{patient.email}</div>
      </div>
      
      {/* Option 2: Using the AddPrescriptionButton component */}
      <AddPrescriptionButton
        patientId={patient._id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        isAdmin={true}
        variant="outline"
        size="sm"
      />
    </div>
  );
}
