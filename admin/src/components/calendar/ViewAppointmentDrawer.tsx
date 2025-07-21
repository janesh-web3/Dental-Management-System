import React, { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  DollarSign,
  AlertTriangle,
  Edit,
  Trash2,
  FileText,
  UserCheck,
  Activity,
  Hash,
  CreditCard,
  Building,
} from "lucide-react";

interface Patient {
  _id: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    contactNumber: string;
    emailAddress?: string;
    age: string;
    gender: string;
    address?: string;
  };
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
  contactNumber?: string;
}

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
  startDateTime: string;
  endDateTime: string;
  duration: number;
  treatmentType: string;
  priority: string;
  subject: string;
  reason: string;
  comments?: string;
  internalNotes?: string;
  chair?: string;
  room?: string;
  estimatedCost?: number;
  actualCost?: number;
  paymentStatus: string;
  status: string;
  hasVisited: boolean;
  isFollowUp?: boolean;
  followUpReason?: string;
  patientId?: Patient;
  doctor?: Doctor;
  createdAt: string;
  updatedAt: string;
}

interface ViewAppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  onStatusChange?: (appointmentId: string, status: string) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  standard: "bg-blue-100 text-blue-800 border-blue-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Accepted: "bg-blue-100 text-blue-800 border-blue-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  "No-Show": "bg-orange-100 text-orange-800 border-orange-200",
  Rescheduled: "bg-purple-100 text-purple-800 border-purple-200",
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  unpaid: "bg-red-100 text-red-800 border-red-200",
};

const ViewAppointmentDrawer: React.FC<ViewAppointmentDrawerProps> = ({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      setLoading(true);
      try {
        await onStatusChange(appointment._id, newStatus);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(appointment);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm("Are you sure you want to delete this appointment?")) {
      onDelete(appointment._id);
      onClose();
    }
  };

  // Use patient data if available, otherwise fall back to appointment data
  const patientData = appointment.patientId || {
    personalDetails: {
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      contactNumber: appointment.phoneNumber,
      age: appointment.age,
      gender: appointment.gender,
      address: appointment.address,
    },
  };

  const appointmentDateTime = new Date(appointment.startDateTime);
  const endDateTime = new Date(appointment.endDateTime);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Details
          </SheetTitle>
          <SheetDescription>
            View comprehensive information about this appointment
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Status & Actions</CardTitle>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                  {appointment.status}
                </Badge>
                <Badge className={priorityColors[appointment.priority as keyof typeof priorityColors]}>
                  {appointment.priority} Priority
                </Badge>
                <Badge className={paymentStatusColors[appointment.paymentStatus as keyof typeof paymentStatusColors]}>
                  Payment: {appointment.paymentStatus}
                </Badge>
                {appointment.hasVisited && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Visited
                  </Badge>
                )}
                {appointment.isFollowUp && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                    Follow-up
                  </Badge>
                )}
              </div>

              {onStatusChange && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {["Accepted", "Completed", "Cancelled", "No-Show"].map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={loading || appointment.status === status}
                      className="text-xs"
                    >
                      Mark as {status}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{patientData.personalDetails.firstName} {patientData.personalDetails.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Age:</span>
                    <span>{patientData.personalDetails.age}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Gender:</span>
                    <span>{patientData.personalDetails.gender}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{patientData.personalDetails.contactNumber}</span>
                  </div>
                  {patientData.personalDetails.emailAddress && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span className="text-sm">{patientData.personalDetails.emailAddress}</span>
                    </div>
                  )}
                  {patientData.personalDetails.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Address:</span>
                      <span className="text-sm">{patientData.personalDetails.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          {appointment.doctor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Assigned Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{appointment.doctor.name}</span>
                </div>
                {appointment.doctor.specialization && (
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Specialization:</span>
                    <span>{appointment.doctor.specialization}</span>
                  </div>
                )}
                {appointment.doctor.contactNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Contact:</span>
                    <span>{appointment.doctor.contactNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{format(appointmentDateTime, "PPP")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span>
                      {format(appointmentDateTime, "p")} - {format(endDateTime, "p")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration:</span>
                    <span>{appointment.duration} minutes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Treatment:</span>
                    <span>{appointment.treatmentType}</span>
                  </div>
                  {(appointment.chair || appointment.room) && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{appointment.chair || appointment.room}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-sm text-muted-foreground mt-1">{appointment.subject}</p>
                </div>
                <div>
                  <span className="font-medium">Reason:</span>
                  <p className="text-sm text-muted-foreground mt-1">{appointment.reason}</p>
                </div>
                {appointment.isFollowUp && appointment.followUpReason && (
                  <div>
                    <span className="font-medium">Follow-up Reason:</span>
                    <p className="text-sm text-muted-foreground mt-1">{appointment.followUpReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          {(appointment.estimatedCost || appointment.actualCost) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointment.estimatedCost && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Estimated Cost:</span>
                    <span>₹{appointment.estimatedCost}</span>
                  </div>
                )}
                {appointment.actualCost && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Actual Cost:</span>
                    <span>₹{appointment.actualCost}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Payment Status:</span>
                  <Badge className={paymentStatusColors[appointment.paymentStatus as keyof typeof paymentStatusColors]}>
                    {appointment.paymentStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(appointment.comments || appointment.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointment.comments && (
                  <div>
                    <span className="font-medium">Comments:</span>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                      {appointment.comments}
                    </p>
                  </div>
                )}
                {appointment.internalNotes && (
                  <div>
                    <span className="font-medium">Internal Notes:</span>
                    <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                      {appointment.internalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span> {format(new Date(appointment.createdAt), "PPp")}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {format(new Date(appointment.updatedAt), "PPp")}
              </div>
              <div>
                <span className="font-medium">Appointment ID:</span> {appointment._id}
              </div>
              {appointment.patientId?._id && (
                <div>
                  <span className="font-medium">Patient ID:</span> {appointment.patientId._id}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ViewAppointmentDrawer;