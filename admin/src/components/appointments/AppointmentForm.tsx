import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";

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
  DialogTrigger,
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
import { crudRequest } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Define the appointment schema
const appointmentFormSchema = z.object({
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
  subject: z.string().min(1, "Subject is required"),
  reason: z.string().min(1, "Reason is required"),
  comments: z.string().optional(),
  doctor: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export interface AppointmentFormProps {
  triggerButton?: React.ReactNode;
  onAppointmentCreated?: () => void;
  doctorId?: string;
  isAdmin?: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  triggerButton,
  onAppointmentCreated,
  doctorId,
  isAdmin = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const { toast } = useToast();
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: "",
      address: "",
      phoneNumber: "",
      gender: "Male",
      appointmentDate: new Date(),
      appointmentTime: "",
      subject: "",
      reason: "",
      comments: "",
      doctor: doctorId || "",
    },
  });

  // Fetch doctors when the form is opened in admin mode
  React.useEffect(() => {
    if (isOpen && isAdmin) {
      fetchDoctors();
    }

    // If doctorId is provided, set it as the selected doctor
    if (doctorId) {
      form.setValue("doctor", doctorId);
    }
  }, [isOpen, doctorId, isAdmin, form]);

  // Function to fetch all doctors
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await crudRequest<Doctor[]>("GET", "/doctor/get-doctor");
      console.log("Fetched doctors:", response);
      if (response) {
        setDoctors(response);
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
  const handleCreateAppointment = async (data: AppointmentFormValues) => {
    setLoading(true);

    try {
      // Format date for API
      const formattedDate = format(data.appointmentDate, "yyyy-MM-dd");

      const appointmentData = {
        ...data,
        appointmentDate: formattedDate,
        doctor: data.doctor || doctorId || undefined,
      };

      const response = await crudRequest(
        "POST",
        "/appointment/add-appointment",
        appointmentData
      );

      if (response) {
        toast({
          title: "Appointment Created",
          description: "The appointment has been successfully scheduled.",
          variant: "default",
        });

        // Reset form and close dialog
        form.reset();
        setIsOpen(false);

        // Notify parent component
        if (onAppointmentCreated) {
          onAppointmentCreated();
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Reset form when dialog is closed
          form.reset({
            firstName: "",
            lastName: "",
            age: "",
            address: "",
            phoneNumber: "",
            gender: "Male",
            appointmentDate: new Date(),
            appointmentTime: "",
            subject: "",
            reason: "",
            comments: "",
            doctor: doctorId || "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new appointment
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateAppointment)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
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
                      <Input placeholder="Last Name" {...field} />
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
                      <Input placeholder="Age" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

            {isAdmin && (
              <FormField
                control={form.control}
                name="doctor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
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
                              {doctor.specialization
                                ? ` (${doctor.specialization})`
                                : ""}
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

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone Number" {...field} />
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
                    <Input placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value ? format(field.value, "yyyy-MM-dd") : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          field.onChange(date);
                        }}
                        min={format(new Date(), "yyyy-MM-dd")}
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
                    <FormLabel>Appointment Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
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
                    <Input placeholder="Subject" {...field} />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional comments"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Appointment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;
