import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  Clock,
  Calendar as CalendarIcon,
  User,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { crudRequest } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const availabilitySchema = z.object({
  doctorId: z.string().min(1, "Doctor selection is required"),
  dayOfWeek: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isAvailable: z.boolean().default(true),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  maxAppointments: z.number().min(1, "Max appointments must be at least 1").default(10),
  notes: z.string().optional(),
});

const timeOffSchema = z.object({
  doctorId: z.string().min(1, "Doctor selection is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  reason: z.string().min(1, "Reason is required"),
  isRecurring: z.boolean().default(false),
  allDay: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;
type TimeOffFormValues = z.infer<typeof timeOffSchema>;

interface DoctorAvailabilityManagerProps {
  onAvailabilityChanged?: () => void;
}

interface Doctor {
  _id: string;
  name: string;
  specialization?: string;
  availability?: WeeklyAvailability[];
}

interface WeeklyAvailability {
  _id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
  maxAppointments: number;
  notes?: string;
}

interface TimeOffPeriod {
  _id?: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isRecurring: boolean;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

const daysOfWeek = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DoctorAvailabilityManager: React.FC<DoctorAvailabilityManagerProps> = ({
  onAvailabilityChanged
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [availability, setAvailability] = useState<WeeklyAvailability[]>([]);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOffPeriod[]>([]);
  const [, setLoading] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<WeeklyAvailability | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  
  const { toast } = useToast();

  const availabilityForm = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      isAvailable: true,
      maxAppointments: 10,
    },
  });

  const timeOffForm = useForm<TimeOffFormValues>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: {
      isRecurring: false,
      allDay: true,
    },
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorAvailability(selectedDoctor);
      fetchTimeOffPeriods(selectedDoctor);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const response = await crudRequest("GET", "/doctor/get-doctor");
      if (response && Array.isArray(response)) {
        setDoctors(response);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    }
  };

  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      setLoading(true);
      const response = await crudRequest("GET", `/doctor/availability/${doctorId}`);
      if (response && typeof response === 'object') {
        setAvailability((response as any).availability || []);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      // Initialize with default availability if none exists
      setAvailability(daysOfWeek.map(day => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: day !== 'Sunday',
        maxAppointments: 10,
      })));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeOffPeriods = async (doctorId: string) => {
    try {
      const response = await crudRequest("GET", `/doctor/time-off/${doctorId}`);
      if (response && Array.isArray(response)) {
        setTimeOffPeriods(response);
      }
    } catch (error) {
      console.error("Error fetching time off periods:", error);
      setTimeOffPeriods([]);
    }
  };

  const handleSaveAvailability = async (data: AvailabilityFormValues) => {
    try {
      const endpoint = editingAvailability?._id 
        ? `/doctor/availability/${editingAvailability._id}`
        : "/doctor/availability";
      
      const method = editingAvailability?._id ? "PUT" : "POST";
      
      const response = await crudRequest(method, endpoint, data);
      
      if (response) {
        toast({
          title: "Availability Updated",
          description: "Doctor availability has been saved successfully",
          variant: "default",
        });
        
        setIsAvailabilityModalOpen(false);
        setEditingAvailability(null);
        availabilityForm.reset();
        fetchDoctorAvailability(selectedDoctor);
        onAvailabilityChanged?.();
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save availability",
        variant: "destructive",
      });
    }
  };

  const handleSaveTimeOff = async (data: TimeOffFormValues) => {
    try {
      const response = await crudRequest("POST", "/doctor/time-off", data);
      
      if (response) {
        toast({
          title: "Time Off Scheduled",
          description: "Time off period has been saved successfully",
          variant: "default",
        });
        
        setIsTimeOffModalOpen(false);
        timeOffForm.reset();
        fetchTimeOffPeriods(selectedDoctor);
        onAvailabilityChanged?.();
      }
    } catch (error) {
      console.error("Error saving time off:", error);
      toast({
        title: "Error",
        description: "Failed to save time off period",
        variant: "destructive",
      });
    }
  };

  const handleEditAvailability = (avail: WeeklyAvailability) => {
    setEditingAvailability(avail);
    availabilityForm.reset({
      doctorId: selectedDoctor,
      dayOfWeek: avail.dayOfWeek,
      startTime: avail.startTime,
      endTime: avail.endTime,
      isAvailable: avail.isAvailable,
      breakStartTime: avail.breakStartTime || "",
      breakEndTime: avail.breakEndTime || "",
      maxAppointments: avail.maxAppointments,
      notes: avail.notes || "",
    });
    setIsAvailabilityModalOpen(true);
  };

  const handleDeleteTimeOff = async (timeOffId: string) => {
    try {
      await crudRequest("DELETE", `/doctor/time-off/${timeOffId}`);
      
      toast({
        title: "Time Off Deleted",
        description: "Time off period has been removed",
        variant: "default",
      });
      
      fetchTimeOffPeriods(selectedDoctor);
      onAvailabilityChanged?.();
    } catch (error) {
      console.error("Error deleting time off:", error);
      toast({
        title: "Error",
        description: "Failed to delete time off period",
        variant: "destructive",
      });
    }
  };

  const getAvailabilityStatus = (avail: WeeklyAvailability): string => {
    if (!avail.isAvailable) return "Unavailable";
    return `${avail.startTime} - ${avail.endTime}`;
  };

  const getAvailabilityColor = (avail: WeeklyAvailability): string => {
    if (!avail.isAvailable) return "bg-red-100 text-red-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Doctor Availability Management</h2>
          <p className="text-muted-foreground">Manage working hours, breaks, and time off</p>
        </div>
      </div>

      {/* Doctor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a doctor to manage availability" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor._id} value={doctor._id}>
                  {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDoctor && (
        <Tabs defaultValue="weekly">
          <TabsList>
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Weekly Schedule */}
          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Weekly Availability
                  </CardTitle>
                  <Dialog open={isAvailabilityModalOpen} onOpenChange={setIsAvailabilityModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAvailability ? 'Edit' : 'Add'} Availability
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...availabilityForm}>
                        <form onSubmit={availabilityForm.handleSubmit(handleSaveAvailability)} className="space-y-4">
                          <input type="hidden" {...availabilityForm.register("doctorId")} value={selectedDoctor} />
                          
                          <FormField
                            control={availabilityForm.control}
                            name="dayOfWeek"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Day of Week</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {daysOfWeek.map((day) => (
                                      <SelectItem key={day} value={day}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={availabilityForm.control}
                            name="isAvailable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Available</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Doctor is available on this day
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {availabilityForm.watch("isAvailable") && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={availabilityForm.control}
                                  name="startTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Start Time</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={availabilityForm.control}
                                  name="endTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Time</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={availabilityForm.control}
                                  name="breakStartTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Break Start (Optional)</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={availabilityForm.control}
                                  name="breakEndTime"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Break End (Optional)</FormLabel>
                                      <FormControl>
                                        <Input type="time" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={availabilityForm.control}
                                name="maxAppointments"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Max Appointments</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={availabilityForm.control}
                                name="notes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          <DialogFooter>
                            <Button type="submit">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {daysOfWeek.map((day) => {
                    const dayAvailability = availability.find(a => a.dayOfWeek === day);
                    return (
                      <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{day}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={dayAvailability ? getAvailabilityColor(dayAvailability) : "bg-gray-100 text-gray-800"}>
                              {dayAvailability ? getAvailabilityStatus(dayAvailability) : "Not Set"}
                            </Badge>
                            {dayAvailability?.breakStartTime && (
                              <Badge variant="outline" className="text-xs">
                                Break: {dayAvailability.breakStartTime} - {dayAvailability.breakEndTime}
                              </Badge>
                            )}
                          </div>
                          {dayAvailability?.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{dayAvailability.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {dayAvailability?.maxAppointments && (
                            <span className="text-sm text-muted-foreground">
                              Max: {dayAvailability.maxAppointments}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dayAvailability && handleEditAvailability(dayAvailability)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Off */}
          <TabsContent value="timeoff">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Time Off Periods
                  </CardTitle>
                  <Dialog open={isTimeOffModalOpen} onOpenChange={setIsTimeOffModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time Off
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Time Off</DialogTitle>
                        <DialogDescription>
                          Block time when the doctor is not available
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...timeOffForm}>
                        <form onSubmit={timeOffForm.handleSubmit(handleSaveTimeOff)} className="space-y-4">
                          <input type="hidden" {...timeOffForm.register("doctorId")} value={selectedDoctor} />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={timeOffForm.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                      onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        field.onChange(date);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={timeOffForm.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                      onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        field.onChange(date);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={timeOffForm.control}
                            name="allDay"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">All Day</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Entire day is blocked
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {!timeOffForm.watch("allDay") && (
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={timeOffForm.control}
                                name="startTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={timeOffForm.control}
                                name="endTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          <FormField
                            control={timeOffForm.control}
                            name="reason"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Vacation, conference, sick leave, etc."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button type="submit">
                              <Save className="h-4 w-4 mr-2" />
                              Schedule Time Off
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeOffPeriods.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No time off periods scheduled</p>
                    </div>
                  ) : (
                    timeOffPeriods.map((timeOff) => (
                      <div key={timeOff._id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{timeOff.reason}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(timeOff.startDate), 'MMM dd, yyyy')} - {format(new Date(timeOff.endDate), 'MMM dd, yyyy')}
                            </p>
                            {!timeOff.allDay && timeOff.startTime && (
                              <p className="text-xs text-muted-foreground">
                                {timeOff.startTime} - {timeOff.endTime}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {timeOff.allDay && (
                              <Badge variant="secondary">All Day</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => timeOff._id && handleDeleteTimeOff(timeOff._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Availability Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Default Appointment Duration</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set the default duration for new appointments
                    </p>
                    <div className="flex items-center gap-4">
                      <Input type="number" placeholder="30" className="w-20" />
                      <span className="text-sm">minutes</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Buffer Time</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Time between appointments for preparation
                    </p>
                    <div className="flex items-center gap-4">
                      <Input type="number" placeholder="15" className="w-20" />
                      <span className="text-sm">minutes</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Advance Booking</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      How far in advance patients can book appointments
                    </p>
                    <div className="flex items-center gap-4">
                      <Input type="number" placeholder="30" className="w-20" />
                      <span className="text-sm">days</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DoctorAvailabilityManager;