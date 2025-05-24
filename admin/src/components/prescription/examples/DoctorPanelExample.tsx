import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePlus, Calendar, Phone, Mail } from "lucide-react";
import { AddPrescriptionButton } from "../AddPrescriptionButton";
import { PrescriptionModal } from "../PrescriptionModal";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

// Interface to match the DoctorDetails from the context
interface DoctorContextDetails {
  role: string;
  name: string;
  email: string;
  contact: string;
  _id: string;
  specialization?: string;
}

// This is an example of how to integrate the prescription functionality
// in the Doctor Panel's patient list

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastVisit?: string;
  nextAppointment?: string;
}

export function DoctorPatientList({ patients }: { patients: Patient[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <PatientCard key={patient._id} patient={patient} />
      ))}
    </div>
  );
}

export function PatientCard({ patient }: { patient: Patient }) {
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const { doctorDetails } = useDoctorAuthContext() as { doctorDetails: DoctorContextDetails };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {patient.firstName} {patient.lastName}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {patient.email}
            </CardDescription>
            <CardDescription className="flex items-center mt-1">
              <Phone className="h-3.5 w-3.5 mr-1" />
              {patient.phone}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {patient.lastVisit && (
          <div className="flex items-center text-sm text-muted-foreground mb-1">
            <span className="font-medium mr-2">Last Visit:</span>
            <span>{new Date(patient.lastVisit).toLocaleDateString()}</span>
          </div>
        )}
        {patient.nextAppointment && (
          <div className="flex items-center text-sm">
            <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
            <span className="font-medium mr-2">Next Appointment:</span>
            <Badge variant="outline" className="font-normal">
              {new Date(patient.nextAppointment).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {/* Option 1: Using the AddPrescriptionButton component */}
        <AddPrescriptionButton
          patientId={patient._id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          doctorId={doctorDetails?._id}
          doctorName={doctorDetails?.name || ""}
          isAdmin={false}
          variant="default"
          size="sm"
        />

        {/* Option 2: Using a custom button and modal */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsPrescriptionModalOpen(true)}
        >
          <FilePlus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>

        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          patientId={patient._id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          doctorId={doctorDetails?._id}
          doctorName={doctorDetails?.name || ""}
          isAdmin={false}
        />
      </CardFooter>
    </Card>
  );
}

// Example of a patient detail page with prescription history
export function PatientDetailPage({ patient }: { patient: Patient }) {
  const { doctorDetails } = useDoctorAuthContext() as { doctorDetails: DoctorContextDetails };
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {patient.firstName} {patient.lastName}
        </h2>
        <Button onClick={() => setIsPrescriptionModalOpen(true)}>
          <FilePlus className="h-4 w-4 mr-2" />
          Add Prescription
        </Button>
      </div>

      {/* Patient information cards and other content would go here */}
      
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patientId={patient._id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        doctorId={doctorDetails?._id}
        doctorName={doctorDetails?.name || ""}
        isAdmin={false}
      />
    </div>
  );
}
