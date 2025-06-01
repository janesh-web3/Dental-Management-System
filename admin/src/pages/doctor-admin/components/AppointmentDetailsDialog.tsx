import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { crudRequest } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Appointment {
  _id: string;
  firstName: string;
  lastName: string;
  age: string;
  address: string;
  phoneNumber: string;
  gender: string;
  appointmentDate: string;
  appointmentTime: string;
  subject: string;
  reason: string;
  comments?: string;
  status: string;
  patientId?: string;
}

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  onStatusChange: () => void;
}

const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  appointment,
  isOpen,
  onClose,
  doctorId,
  onStatusChange,
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>(appointment?.status || "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset status when appointment changes
  React.useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
    }
  }, [appointment]);

  if (!appointment) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status.toLowerCase()) {
      case "accepted":
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
      case "rejected":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleStatusChange = async () => {
    if (status === appointment.status) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get token from sessionStorage to ensure we're authenticated
      const token = sessionStorage.getItem("doctorToken");
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication required. Please log in again."
        });
        setIsSubmitting(false);
        return;
      }
      
      // Use doctorId in the API call to ensure proper authorization
      const response = await crudRequest<{
        success: boolean;
        message?: string;
      }>(
        "PUT",
        `/appointment/update-appointment-status/${appointment._id}`,
        { status, doctorId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Appointment status updated to ${status}`,
        });
        onStatusChange();
        onClose();
      } else {
        throw new Error(response.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update appointment status",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {appointment.firstName} {appointment.lastName}
            </h3>
            <Badge variant={getStatusBadgeVariant(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Information</p>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Age:</span> {appointment.age}
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {appointment.gender}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {appointment.phoneNumber}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {appointment.address}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Appointment Information</p>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(appointment.appointmentDate)}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{" "}
                  {appointment.appointmentTime}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {appointment.subject}
                </div>
                <div>
                  <span className="font-medium">Patient ID:</span>{" "}
                  {appointment.patientId || "Not registered"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Reason for Appointment</p>
            <div className="bg-muted p-3 rounded-md">{appointment.reason}</div>
          </div>

          {appointment.comments && (
            <div>
              <p className="text-sm font-medium mb-2">Additional Comments</p>
              <div className="bg-muted p-3 rounded-md">{appointment.comments}</div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Update Status</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleStatusChange} 
            disabled={status === appointment.status || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsDialog;
