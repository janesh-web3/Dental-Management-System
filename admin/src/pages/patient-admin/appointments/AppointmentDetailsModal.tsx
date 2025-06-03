import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctor: Doctor;
  doctorId: Doctor;
  subject: string;
  reason: string;
  status: string;
  notes?: string;
  comments?: string;
}

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onEdit: () => void;
}

// Helper function for status badge styling
const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (status.toLowerCase()) {
    case "completed":
      return "secondary"; // Using secondary for completed as success is not available
    case "approved":
      return "secondary";
    case "pending":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onEdit,
}) => {
  const canEdit = appointment && 
    ["pending", "approved"].includes(appointment.status.toLowerCase());

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Appointment Details</span>
            <Badge variant={getStatusVariant(appointment.status)}>
              {appointment.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View the complete details of your appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
              <p className="text-base">
                {format(new Date(appointment.appointmentDate), "MMMM d, yyyy")}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
              <p className="text-base">{appointment.appointmentTime}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Doctor</h4>
            <p className="text-base">
              {appointment.doctor?.name || appointment.doctorId?.name}
              {(appointment.doctor?.specialization || appointment.doctorId?.specialization) && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({appointment.doctor?.specialization || appointment.doctorId?.specialization})
                </span>
              )}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Subject</h4>
            <p className="text-base">{appointment.subject}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Reason</h4>
            <p className="text-base whitespace-pre-line">{appointment.reason}</p>
          </div>

          {(appointment.notes || appointment.comments) && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                {appointment.notes ? "Notes" : "Comments"}
              </h4>
              <p className="text-base whitespace-pre-line">
                {appointment.notes || appointment.comments}
              </p>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Appointment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
