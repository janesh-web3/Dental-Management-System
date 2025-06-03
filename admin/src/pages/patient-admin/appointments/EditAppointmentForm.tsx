import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { crudRequest } from "@/utils/api";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Define appointment form schema with validation
const appointmentFormSchema = z.object({
  appointmentDate: z.date({
    required_error: "Appointment date is required",
  }),
  appointmentTime: z.string({
    required_error: "Appointment time is required",
  }),
  doctor: z.string({
    required_error: "Please select a doctor",
  }),
  subject: z.string().min(1, "Subject is required"),
  reason: z.string().min(1, "Reason is required"),
  comments: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

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
  patientId?: string;
}

interface EditAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

const EditAppointmentForm: React.FC<EditAppointmentFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointment,
}) => {
  const { patientDetails } = usePatientAuthContext();
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with default values from the appointment
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      appointmentDate: appointment ? new Date(appointment.appointmentDate) : new Date(),
      appointmentTime: appointment?.appointmentTime || "10:00",
      doctor: appointment?.doctor?._id || appointment?.doctorId?._id || "",
      subject: appointment?.subject || "",
      reason: appointment?.reason || "",
      comments: appointment?.comments || "",
    },
  });
  
  // Reset form values when appointment changes
  React.useEffect(() => {
    if (appointment && isOpen) {
      form.reset({
        appointmentDate: new Date(appointment.appointmentDate),
        appointmentTime: appointment.appointmentTime,
        doctor: appointment.doctor?._id || appointment.doctorId?._id || "",
        subject: appointment.subject,
        reason: appointment.reason,
        comments: appointment.comments || "",
      });
    }
  }, [appointment, form, isOpen]);

  // Fetch doctors when component mounts
  React.useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const response = await crudRequest<Doctor[]>("GET", "/doctor/get-doctor");
        if (response.success && response.data) {
          setDoctors(response.data);
        }
      } catch (error) {
        toast.error("Failed to fetch doctors");
        console.error("Error fetching doctors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  // Handle form submission
  const onSubmit = async (data: AppointmentFormValues) => {
    if (!appointment?._id) {
      toast.error("Appointment ID is missing");
      return;
    }

    setIsSubmitting(true);
    try {
      // Format date and time for API
      const formattedDate = format(data.appointmentDate, "yyyy-MM-dd");
      
      // Prepare appointment data
      const appointmentData = {
        appointmentDate: formattedDate,
        appointmentTime: data.appointmentTime,
        doctorId: data.doctor,
        subject: data.subject,
        reason: data.reason,
        comments: data.comments || "",
        patientId: patientDetails._id,
      };

      // Make API call to update appointment
      const response = await crudRequest("PUT", `/appointment/${appointment._id}`, appointmentData);
      
      if (response.success) {
        toast.success("Appointment updated successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("An error occurred while updating the appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Make changes to your appointment details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Appointment Date */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Appointment Time */}
              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 8).map(
                          (hour) => (
                            <React.Fragment key={hour}>
                              <SelectItem value={`${hour}:00`}>
                                {hour}:00 {hour < 12 ? "AM" : "PM"}
                              </SelectItem>
                              <SelectItem value={`${hour}:30`}>
                                {hour}:30 {hour < 12 ? "AM" : "PM"}
                              </SelectItem>
                            </React.Fragment>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Doctor */}
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
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2">Loading doctors...</span>
                          </div>
                        ) : doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              {doctor.name}
                              {doctor.specialization && ` (${doctor.specialization})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No doctors available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subject */}
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
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Appointment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe the reason for your appointment"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comments */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information you'd like to share"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Appointment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentForm;
