import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  Loader2, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Stethoscope,
  FileText
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crudRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Enhanced appointment schema with new fields
const appointmentFormSchema = z.object({
  patientId: z.string().optional(), // New field for existing patient selection
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.string().min(1, "Age is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  gender: z.string().min(1, "Gender is required"),
  appointmentDate: z.date({
    required_error: "Appointment date is required",
  }),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  treatmentType: z.string().min(1, "Treatment type is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  subject: z.string().min(1, "Subject is required"),
  reason: z.string().min(1, "Reason is required"),
  comments: z.string().optional(),
  internalNotes: z.string().optional(),
  chair: z.string().optional(),
  room: z.string().optional(),
  estimatedCost: z.number().optional(),
  doctor: z.string().optional(),
  isFollowUp: z.boolean().optional(),
  followUpReason: z.string().optional(),
});

export type CalendarAppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export interface CalendarAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentSaved?: () => void;
  doctorId?: string;
  isAdmin?: boolean;
  selectedSlot?: {
    start: Date;
    end: Date;
  };
  editingAppointment?: any;
  mode: 'create' | 'edit' | 'view';
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

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

const treatmentTypes = [
  "Consultation",
  "Cleaning", 
  "Extraction", 
  "Root Canal", 
  "Filling", 
  "Crown", 
  "Bridge", 
  "Implant", 
  "Orthodontics",
  "Whitening",
  "Emergency",
  "Follow-up",
  "Other"
];

const priorities = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "standard", label: "Standard", color: "bg-blue-100 text-blue-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
];

const appointmentStatuses = [
  { value: "Pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "Accepted", label: "Accepted", color: "bg-green-100 text-green-800" },
  { value: "Rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "Completed", label: "Completed", color: "bg-blue-100 text-blue-800" },
  { value: "Cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800" },
  { value: "No-Show", label: "No-Show", color: "bg-purple-100 text-purple-800" },
  { value: "Rescheduled", label: "Rescheduled", color: "bg-orange-100 text-orange-800" }
];

const CalendarAppointmentModal: React.FC<CalendarAppointmentModalProps> = ({
  isOpen,
  onClose,
  onAppointmentSaved,
  doctorId,
  isAdmin = false,
  selectedSlot,
  editingAppointment,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(true);
  const { toast } = useToast();

  // Calculate default duration from slot if available
  const defaultDuration = selectedSlot 
    ? Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60))
    : 30;

  const form = useForm<CalendarAppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      firstName: "",
      lastName: "",
      age: "",
      address: "",
      phoneNumber: "",
      gender: "Male",
      appointmentDate: selectedSlot?.start || new Date(),
      appointmentTime: selectedSlot?.start ? format(selectedSlot.start, "HH:mm") : "",
      duration: defaultDuration,
      treatmentType: "Consultation",
      priority: "standard",
      status: "Pending",
      subject: "",
      reason: "",
      comments: "",
      internalNotes: "",
      chair: "",
      room: "",
      estimatedCost: 0,
      doctor: doctorId || "",
      isFollowUp: false,
      followUpReason: "",
    },
  });

  // Load appointment data for editing
  useEffect(() => {
    if (editingAppointment && (mode === 'edit' || mode === 'view')) {
      form.reset({
        patientId: editingAppointment.patientId?._id || "",
        firstName: editingAppointment.firstName || "",
        lastName: editingAppointment.lastName || "",
        age: editingAppointment.age || "",
        address: editingAppointment.address || "",
        phoneNumber: editingAppointment.phoneNumber || "",
        gender: editingAppointment.gender || "Male",
        appointmentDate: editingAppointment.startDateTime ? new Date(editingAppointment.startDateTime) : new Date(),
        appointmentTime: editingAppointment.startDateTime ? format(new Date(editingAppointment.startDateTime), "HH:mm") : "",
        duration: editingAppointment.duration || 30,
        treatmentType: editingAppointment.treatmentType || "Consultation",
        priority: editingAppointment.priority || "standard",
        status: editingAppointment.status || "Pending",
        subject: editingAppointment.subject || "",
        reason: editingAppointment.reason || "",
        comments: editingAppointment.comments || "",
        internalNotes: editingAppointment.internalNotes || "",
        chair: editingAppointment.chair || "",
        room: editingAppointment.room || "",
        estimatedCost: editingAppointment.estimatedCost || 0,
        doctor: editingAppointment.doctor?._id || "",
        isFollowUp: editingAppointment.isFollowUp || false,
        followUpReason: editingAppointment.followUpReason || "",
      });
      
      // Set patient selection state based on whether we have a patientId
      setIsNewPatient(!editingAppointment.patientId?._id);
    }
  }, [editingAppointment, mode, form]);

  // Fetch doctors and patients when modal opens
  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchDoctors();
      fetchPatients(); // Load initial patient list
    }
  }, [isOpen, isAdmin]);

  // Debounced patient search
  useEffect(() => {
    if (patientSearchQuery) {
      const timer = setTimeout(() => {
        fetchPatients(patientSearchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      fetchPatients();
    }
  }, [patientSearchQuery]);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await crudRequest<{doctors: Doctor[]}>("GET", "/appointment/doctors-autocomplete");
      if (response?.doctors) {
        setDoctors(response.doctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchPatients = async (search = "") => {
    try {
      setLoadingPatients(true);
      const queryParam = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await crudRequest<{patients: Patient[]}>("GET", `/appointment/patients-autocomplete${queryParam}`);
      if (response?.patients) {
        setPatients(response.patients);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    // Auto-fill patient information
    form.setValue("patientId", patient._id);
    form.setValue("firstName", patient.personalDetails.firstName);
    form.setValue("lastName", patient.personalDetails.lastName);
    form.setValue("age", patient.personalDetails.age);
    form.setValue("gender", patient.personalDetails.gender);
    form.setValue("phoneNumber", patient.personalDetails.contactNumber);
    form.setValue("address", patient.personalDetails.address || "");
    
    setIsNewPatient(false);
    setPatientSearchQuery("");
    
    toast({
      title: "Patient Selected",
      description: `Patient information auto-filled for ${patient.personalDetails.firstName} ${patient.personalDetails.lastName}`,
    });
  };

  const handleNewPatient = () => {
    // Clear patient selection and enable manual entry
    form.setValue("patientId", "");
    form.setValue("firstName", "");
    form.setValue("lastName", "");
    form.setValue("age", "");
    form.setValue("gender", "Male");
    form.setValue("phoneNumber", "");
    form.setValue("address", "");
    
    setIsNewPatient(true);
    setPatientSearchQuery("");
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!editingAppointment) return;

    try {
      setLoading(true);
      const response = await crudRequest(
        "PUT",
        `/appointment/update-appointment-status/${editingAppointment._id}`,
        { status: newStatus }
      );

      if (response) {
        // Update the form value to reflect the change
        form.setValue("status", newStatus);
        
        toast({
          title: "Status Updated",
          description: `Appointment status has been changed to ${newStatus}.`,
          variant: "default",
        });

        onAppointmentSaved?.();
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointment = async (data: CalendarAppointmentFormValues) => {
    setLoading(true);

    try {
      const formattedDate = format(data.appointmentDate, "yyyy-MM-dd");
      
      // Create start and end DateTime objects
      const startDateTime = new Date(`${formattedDate}T${data.appointmentTime}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + data.duration);

      const appointmentData = {
        ...data,
        appointmentDate: formattedDate,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        doctor: data.doctor || doctorId || undefined,
      };

      // Remove patientId if it's empty (for new patients)
      if (!data.patientId || data.patientId === "") {
        delete appointmentData.patientId;
      }

      let response;
      if (mode === 'edit' && editingAppointment) {
        response = await crudRequest(
          "PUT",
          `/appointment/update-appointment/${editingAppointment._id}`,
          appointmentData
        );
      } else {
        response = await crudRequest(
          "POST",
          "/appointment/add-appointment",
          appointmentData
        );
      }

      if (response) {
        toast({
          title: mode === 'edit' ? "Appointment Updated" : "Appointment Created",
          description: `The appointment has been successfully ${mode === 'edit' ? 'updated' : 'scheduled'}.`,
          variant: "default",
        });

        onClose();
        onAppointmentSaved?.();
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Error",
        description: `Failed to ${mode === 'edit' ? 'update' : 'create'} appointment. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAppointment) return;

    try {
      setLoading(true);
      await crudRequest("DELETE", `/appointment/delete-appointment/${editingAppointment._id}`);
      
      toast({
        title: "Appointment Deleted",
        description: "The appointment has been successfully deleted.",
        variant: "default",
      });

      onClose();
      onAppointmentSaved?.();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Appointment';
      case 'edit': return 'Edit Appointment';
      case 'view': return 'Appointment Details';
      default: return 'Appointment';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && "Fill in the details to schedule a new appointment"}
            {mode === 'edit' && "Update the appointment details"}
            {mode === 'view' && "View appointment information"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveAppointment)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                <TabsTrigger value="treatment">Treatment</TabsTrigger>
                <TabsTrigger value="notes">Notes & Tasks</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Patient Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Patient Selection</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={isNewPatient ? "default" : "outline"}
                            size="sm"
                            onClick={handleNewPatient}
                            disabled={isReadOnly}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            New Patient
                          </Button>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Search existing patients..."
                                value={patientSearchQuery}
                                onChange={(e) => setPatientSearchQuery(e.target.value)}
                                disabled={isReadOnly}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPatientSearchQuery("")}
                                disabled={isReadOnly || !patientSearchQuery}
                              >
                                Clear
                              </Button>
                            </div>
                            {patientSearchQuery && (
                              <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
                                {loadingPatients ? (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    Searching patients...
                                  </div>
                                ) : patients && patients.length > 0 ? (
                                  <div className="p-1">
                                    {patients.map((patient) => (
                                      <div
                                        key={patient._id}
                                        className="flex items-center p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm border-b last:border-b-0"
                                        onClick={() => handlePatientSelect(patient)}
                                      >
                                        <div className="flex flex-col flex-1">
                                          <span className="text-sm font-medium">
                                            {patient.personalDetails.firstName} {patient.personalDetails.lastName}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            📞 {patient.personalDetails.contactNumber} • Age: {patient.personalDetails.age} • {patient.personalDetails.gender}
                                          </span>
                                          {patient.personalDetails.address && (
                                            <span className="text-xs text-muted-foreground">
                                              📍 {patient.personalDetails.address}
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="ml-2"
                                        >
                                          Select
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    No patients found matching "{patientSearchQuery}".
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!isNewPatient && form.watch("patientId") && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              Patient: {form.watch("firstName")} {form.watch("lastName")}
                            </span>
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            {form.watch("phoneNumber")} • Age: {form.watch("age")} • {form.watch("gender")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First Name" {...field} disabled={isReadOnly || !isNewPatient} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last Name" {...field} disabled={isReadOnly || !isNewPatient} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input placeholder="Age" {...field} disabled={isReadOnly || !isNewPatient} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly || !isNewPatient}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone Number" {...field} disabled={isReadOnly || !isNewPatient} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Address" {...field} disabled={isReadOnly || !isNewPatient} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scheduling Tab */}
              <TabsContent value="scheduling" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Scheduling Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : null;
                                  field.onChange(date);
                                }}
                                min={format(new Date(), "yyyy-MM-dd")}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="appointmentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                min={15}
                                max={480}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isAdmin && (
                      <FormField
                        control={form.control}
                        name="doctor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Doctor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isReadOnly}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a doctor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingDoctors ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Loading...
                                  </div>
                                ) : doctors.length === 0 ? (
                                  <div className="p-2 text-center text-muted-foreground">
                                    No doctors found
                                  </div>
                                ) : (
                                  doctors.map((doctor) => (
                                    <SelectItem key={doctor._id} value={doctor._id}>
                                      {doctor.name}
                                      {doctor.specialization ? ` (${doctor.specialization})` : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="chair"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chair/Room</FormLabel>
                            <FormControl>
                              <Input placeholder="Chair number or room" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimatedCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Cost</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Treatment Tab */}
              <TabsContent value="treatment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Treatment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="treatmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Treatment Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select treatment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {treatmentTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {priorities.map((priority) => (
                                  <SelectItem key={priority.value} value={priority.value}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={priority.color}>{priority.label}</Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // If in edit mode, immediately update the status
                                if (mode === 'edit' && editingAppointment && value !== editingAppointment.status) {
                                  handleStatusUpdate(value);
                                }
                              }} 
                              defaultValue={field.value} 
                              disabled={isReadOnly || mode === 'create'}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {appointmentStatuses.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={status.color}>{status.label}</Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Appointment subject" {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Reason for appointment"
                              className="resize-none"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes & Tasks Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes & Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments (Patient Visible)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional comments"
                              className="resize-none"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="internalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Notes (Staff Only)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Internal notes for staff"
                              className="resize-none"
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="followUpReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Follow-up Reason (if applicable)</FormLabel>
                          <FormControl>
                            <Input placeholder="Follow-up reason" {...field} disabled={isReadOnly} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              {mode === 'view' ? (
                <Button type="button" onClick={onClose}>
                  Close
                </Button>
              ) : (
                <>
                  {mode === 'edit' && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === 'edit' ? 'Update Appointment' : 'Create Appointment'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarAppointmentModal;