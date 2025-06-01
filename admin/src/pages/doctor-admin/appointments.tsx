import React, { useState, useEffect } from "react";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import { crudRequest } from "@/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Search, Edit2, X, Filter, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";
import AppointmentDetailsDialog from "./components/AppointmentDetailsDialog";

// Removed unused interface

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

// Form schema for creating/editing appointments
const appointmentFormSchema = z.object({
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
  age: z.string().min(1, "Age is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().length(10, "Phone number must be exactly 10 digits"),
  gender: z.enum(["Male", "Female", "Other"]),
  appointmentDate: z.date({
    required_error: "Appointment date is required",
  }),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  subject: z.string().min(1, "Subject is required"),
  reason: z.string().min(1, "Reason is required"),
  comments: z.string().optional(),
  patientId: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const Appointments: React.FC = () => {
  const { doctorDetails, isLoading } = useDoctorAuthContext();

  // Get the doctor ID from the auth context
  const doctorId = doctorDetails?._id || "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading doctor panel...</span>
      </div>
    );
  }

  const [loading, setLoading] = useState<boolean>(true);
  // We'll only use groupedAppointments for display, but we keep the appointments array for other operations
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<{
    [key: string]: Appointment[];
  }>({});
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [currentAppointment, setCurrentAppointment] =
    useState<Appointment | null>(null);
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
    },
  });

  const editForm = useForm<AppointmentFormValues>({
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
    },
  });

  useEffect(() => {
    fetchAppointments();
  }, [doctorId, currentPage, searchTerm, statusFilter]);

  // Initialize the create appointment form when dialog is opened
  useEffect(() => {
    if (isCreateDialogOpen) {
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
      });
    }
  }, [isCreateDialogOpen, form]);

  // Response type is inferred from crudRequest

  // Function to format date for display
  const formatAppointmentDate = (dateString: string | undefined) => {
    if (!dateString) {
      return "Unknown Date";
    }

    try {
      const date = parseISO(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      if (isToday(date)) {
        return "Today";
      } else if (isTomorrow(date)) {
        return "Tomorrow";
      } else if (isYesterday(date)) {
        return "Yesterday";
      }

      return format(date, "EEEE, MMMM d, yyyy");
    } catch (error) {
      console.error("Error parsing date:", error);
      return "Invalid Date";
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Check if doctorId is available
      if (!doctorId) {
        console.error("Doctor ID is not available. User may not be logged in.");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in to view appointments"
        });
        setLoading(false);
        return;
      }
      
      // Get token from localStorage to ensure we're authenticated
      const token = sessionStorage.getItem("doctorToken");
      if (!token) {
        console.error("No authentication token found");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication required. Please log in again."
        });
        setLoading(false);
        return;
      }
      
      const response = await crudRequest(
        "GET",
        `/doctor-admin/appointments/${doctorId}`,
        {
          params: {
            search: searchTerm,
            status: statusFilter !== "all" ? statusFilter : undefined,
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log(response)

      if (response.success && response.data) {
        try {
          // Safely access data with type checking
          const responseData = response.data as any;
          const appointments = Array.isArray(responseData.result) ? responseData.result : [];
          setAppointments(appointments);

          // Group appointments by date for display
          const grouped: { [key: string]: Appointment[] } = {};
          if (Array.isArray(appointments)) {
            appointments.forEach((appointment) => {
              if (appointment && appointment.appointmentDate) {
                const formattedDate = formatAppointmentDate(
                  appointment.appointmentDate
                );
                if (!grouped[formattedDate]) {
                  grouped[formattedDate] = [];
                }
                grouped[formattedDate].push(appointment);
              }
            });
          }
          setGroupedAppointments(grouped);

          // Get total pages directly from the response
          const totalPages = typeof responseData.totalPages === 'number' ? responseData.totalPages : 1;
          setTotalPages(totalPages);
        } catch (error: any) {
          console.error("Error processing appointment data:", error);
          setAppointments([]);
          setGroupedAppointments({});
          setTotalPages(1);
        }
      } else {
        throw new Error(response.message || "Failed to fetch appointments");
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
      setGroupedAppointments({});
      
      // Improved error handling with user feedback
      if (error?.response?.status === 401 || error?.message?.includes("token")) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to view appointments"
        });
        // Optional: Redirect to login page
        // navigate("/doctor-login");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || "Failed to load appointments"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    try {
      setLoading(true);
      const formattedValues = {
        ...values,
        appointmentDate: format(values.appointmentDate, "yyyy-MM-dd"),
      };

      const response = await crudRequest<{
        success: boolean;
        message?: string;
      }>("POST", `/doctor-admin/appointments/${doctorId}`, {
        data: formattedValues,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });

        setIsCreateDialogOpen(false);
        form.reset();
        fetchAppointments();
      } else {
        throw new Error(response.message || "Failed to create appointment");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create appointment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAppointment = async (values: AppointmentFormValues) => {
    if (!currentAppointment) return;

    try {
      setLoading(true);
      const formattedValues = {
        ...values,
        appointmentDate: format(values.appointmentDate, "yyyy-MM-dd"),
      };

      const response = await crudRequest<{
        success: boolean;
        message?: string;
      }>(
        "PUT",
        `/doctor-admin/appointments/${doctorId}/${currentAppointment._id}`,
        { data: formattedValues }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });

        setIsEditDialogOpen(false);
        editForm.reset();
        fetchAppointments();
      } else {
        throw new Error(response.message || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update appointment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await crudRequest<{
        success: boolean;
        message?: string;
      }>(
        "PUT",
        `/doctor-admin/appointments/${doctorId}/${appointmentId}/cancel`
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
        });

        fetchAppointments();
      } else {
        throw new Error(response.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel appointment",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);

    // Parse the date string to a Date object
    const appointmentDate = new Date(appointment.appointmentDate);

    editForm.reset({
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      age: appointment.age,
      address: appointment.address,
      phoneNumber: appointment.phoneNumber,
      gender: appointment.gender as "Male" | "Female" | "Other",
      appointmentDate: appointmentDate,
      appointmentTime: appointment.appointmentTime,
      subject: appointment.subject,
      reason: appointment.reason,
      comments: appointment.comments || "",
      patientId: appointment.patientId,
    });

    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = (appointment: Appointment) => {
    setCurrentAppointment(appointment);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Manage your patient appointments
              </CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
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
                  });
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
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
                                  field.value
                                    ? format(field.value, "yyyy-MM-dd")
                                    : ""
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
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Appointment
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {appointments.length > 0 &&
              Object.keys(groupedAppointments).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedAppointments).map(
                    ([date, dateAppointments]) => (
                      <div key={date} className="space-y-2">
                        <h3 className="text-lg font-semibold">{date}</h3>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dateAppointments.map((appointment) => (
                                <TableRow key={appointment._id}>
                                  <TableCell className="font-medium">
                                    {appointment.firstName}{" "}
                                    {appointment.lastName}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {appointment.appointmentTime}
                                    </div>
                                  </TableCell>
                                  <TableCell>{appointment.subject}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        appointment.status.toLowerCase() ===
                                        "accepted"
                                          ? "default"
                                          : appointment.status.toLowerCase() ===
                                              "rejected"
                                            ? "destructive"
                                            : "outline"
                                      }
                                    >
                                      {appointment.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                          openEditDialog(appointment)
                                        }
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                          handleCancelAppointment(
                                            appointment._id
                                          )
                                        }
                                        disabled={
                                          appointment.status.toLowerCase() ===
                                          "rejected"
                                        }
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          openDetailsDialog(appointment)
                                        }
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No appointments found
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Appointment Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            // Reset form when dialog is closed without saving
            setCurrentAppointment(null);
            editForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the appointment details
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditAppointment)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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

              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                  Update Appointment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        appointment={currentAppointment}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        doctorId={doctorId}
        onStatusChange={fetchAppointments}
      />
    </div>
  );
};

export default Appointments;
