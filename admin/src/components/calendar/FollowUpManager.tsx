import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays } from 'date-fns';
import {
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Users,
  RefreshCw
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
import { crudRequest } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const followUpSchema = z.object({
  parentAppointmentId: z.string().min(1, "Parent appointment is required"),
  followUpDate: z.date({
    required_error: "Follow-up date is required",
  }),
  followUpTime: z.string().min(1, "Follow-up time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  treatmentType: z.string().min(1, "Treatment type is required"),
  priority: z.string().min(1, "Priority is required"),
  reason: z.string().min(1, "Follow-up reason is required"),
  autoReminder: z.boolean().default(true),
  reminderDays: z.number().min(1).max(30).default(1),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

interface FollowUpManagerProps {
  onFollowUpCreated?: () => void;
}

interface CompletedAppointment {
  _id: string;
  firstName: string;
  lastName: string;
  treatmentType: string;
  completionDate: string;
  doctor: {
    _id: string;
    name: string;
  };
  hasFollowUp?: boolean;
}

interface PendingFollowUp {
  _id: string;
  patientName: string;
  originalDate: string;
  followUpDate: string;
  treatmentType: string;
  priority: string;
  status: string;
  daysSince: number;
}

const FollowUpManager: React.FC<FollowUpManagerProps> = ({
  onFollowUpCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUp[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<PendingFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'overdue'>('all');
  
  const { toast } = useToast();
  
  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      duration: 30,
      treatmentType: "Follow-up",
      priority: "standard",
      autoReminder: true,
      reminderDays: 1,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch completed appointments that might need follow-ups
      const completedResponse = await crudRequest("GET", "/appointment/get-appointments?status=Completed&calendar=true");
      if (completedResponse && Array.isArray(completedResponse)) {
        const filtered = completedResponse
          .filter((apt: any) => !apt.hasFollowUp && needsFollowUp(apt))
          .slice(0, 20); // Limit to recent 20
        setCompletedAppointments(filtered);
      }

      // Fetch pending follow-ups
      const pendingResponse = await crudRequest("GET", "/appointment/get-appointments?isFollowUp=true&status=Pending");
      if (pendingResponse && Array.isArray(pendingResponse)) {
        const today = new Date();
        const pending = pendingResponse.map((apt: any) => ({
          _id: apt._id,
          patientName: `${apt.firstName} ${apt.lastName}`,
          originalDate: apt.createdAt,
          followUpDate: apt.appointmentDate,
          treatmentType: apt.treatmentType,
          priority: apt.priority,
          status: apt.status,
          daysSince: Math.floor((today.getTime() - new Date(apt.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        }));
        
        setPendingFollowUps(pending);
        setOverdueFollowUps(pending.filter((f: any) => f.daysSince > 7));
      }
      
    } catch (error) {
      console.error("Error fetching follow-up data:", error);
      toast({
        title: "Error",
        description: "Failed to load follow-up data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const needsFollowUp = (appointment: any): boolean => {
    const followUpTreatments = [
      'Root Canal',
      'Extraction', 
      'Crown',
      'Bridge',
      'Implant',
      'Orthodontics',
      'Surgery'
    ];
    
    return followUpTreatments.includes(appointment.treatmentType);
  };

  const getQuickFollowUpDate = (appointment: any, days: number): Date => {
    const completionDate = new Date(appointment.completionDate || appointment.createdAt);
    return addDays(completionDate, days);
  };

  const createQuickFollowUp = async (appointment: CompletedAppointment, days: number) => {
    try {
      const followUpDate = getQuickFollowUpDate(appointment, days);
      const followUpData = {
        firstName: appointment.firstName,
        lastName: appointment.lastName,
        appointmentDate: format(followUpDate, 'yyyy-MM-dd'),
        appointmentTime: "10:00",
        duration: 30,
        treatmentType: "Follow-up",
        priority: days <= 3 ? "urgent" : "standard",
        subject: `Follow-up for ${appointment.treatmentType}`,
        reason: `Scheduled follow-up after ${appointment.treatmentType} treatment`,
        doctor: appointment.doctor._id,
        isFollowUp: true,
        previousAppointmentId: appointment._id,
        age: "0", // Will be filled from patient data
        address: "", // Will be filled from patient data  
        phoneNumber: "", // Will be filled from patient data
        gender: "Male", // Will be filled from patient data
      };

      const response = await crudRequest("POST", "/appointment/add-appointment", followUpData);
      
      if (response) {
        toast({
          title: "Follow-up Created",
          description: `Follow-up appointment scheduled for ${format(followUpDate, 'MMM dd, yyyy')}`,
          variant: "default",
        });
        
        fetchData();
        onFollowUpCreated?.();
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to create follow-up appointment",
        variant: "destructive",
      });
    }
  };

  const handleCreateFollowUp = async (data: FollowUpFormValues) => {
    try {
      const selectedAppointment = completedAppointments.find(apt => apt._id === data.parentAppointmentId);
      if (!selectedAppointment) return;

      const followUpData = {
        firstName: selectedAppointment.firstName,
        lastName: selectedAppointment.lastName,
        appointmentDate: format(data.followUpDate, 'yyyy-MM-dd'),
        appointmentTime: data.followUpTime,
        duration: data.duration,
        treatmentType: data.treatmentType,
        priority: data.priority,
        subject: `Follow-up for ${selectedAppointment.treatmentType}`,
        reason: data.reason,
        doctor: selectedAppointment.doctor._id,
        isFollowUp: true,
        previousAppointmentId: data.parentAppointmentId,
        age: "0", // Will be filled from patient data
        address: "", // Will be filled from patient data
        phoneNumber: "", // Will be filled from patient data
        gender: "Male", // Will be filled from patient data
      };

      const response = await crudRequest("POST", "/appointment/add-appointment", followUpData);
      
      if (response) {
        toast({
          title: "Follow-up Created",
          description: `Follow-up appointment scheduled successfully`,
          variant: "default",
        });
        
        setIsOpen(false);
        form.reset();
        fetchData();
        onFollowUpCreated?.();
      }
    } catch (error) {
      console.error("Error creating follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to create follow-up appointment",
        variant: "destructive",
      });
    }
  };

  const filteredPendingFollowUps = pendingFollowUps.filter(followUp => {
    switch (selectedFilter) {
      case 'urgent':
        return followUp.priority === 'urgent';
      case 'overdue':
        return followUp.daysSince > 7;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Follow-up Management</h2>
          <p className="text-muted-foreground">Manage patient follow-up appointments and reminders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Follow-up Appointment</DialogTitle>
                <DialogDescription>
                  Create a follow-up appointment for a completed treatment
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateFollowUp)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="parentAppointmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Completed Appointment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose appointment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {completedAppointments.map((apt) => (
                              <SelectItem key={apt._id} value={apt._id}>
                                {apt.firstName} {apt.lastName} - {apt.treatmentType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="followUpDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Follow-up Date</FormLabel>
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="followUpTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
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
                            />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Reason for follow-up appointment"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit">Create Follow-up</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Follow-ups</TabsTrigger>
          <TabsTrigger value="needed">Need Follow-up</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        {/* Pending Follow-ups */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Follow-ups ({filteredPendingFollowUps.length})
                </CardTitle>
                <Select value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="urgent">Urgent Only</SelectItem>
                    <SelectItem value="overdue">Overdue Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPendingFollowUps.map((followUp) => (
                  <div key={followUp._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{followUp.patientName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {followUp.treatmentType} - Follow-up on {new Date(followUp.followUpDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={followUp.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {followUp.priority}
                        </Badge>
                        {followUp.daysSince > 7 && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPendingFollowUps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending follow-ups found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Need Follow-up */}
        <TabsContent value="needed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patients Needing Follow-up ({completedAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {appointment.firstName} {appointment.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {appointment.treatmentType} completed on{' '}
                          {new Date(appointment.completionDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {appointment.doctor.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createQuickFollowUp(appointment, 3)}
                        >
                          3 Days
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createQuickFollowUp(appointment, 7)}
                        >
                          1 Week
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createQuickFollowUp(appointment, 14)}
                        >
                          2 Weeks
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {completedAppointments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No patients currently need follow-up appointments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Overdue Follow-ups ({overdueFollowUps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueFollowUps.map((followUp) => (
                  <div key={followUp._id} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">{followUp.patientName}</h4>
                        <p className="text-sm text-red-700">
                          {followUp.treatmentType} - {followUp.daysSince} days overdue
                        </p>
                      </div>
                      <Badge variant="destructive">
                        Urgent Action Required
                      </Badge>
                    </div>
                  </div>
                ))}
                {overdueFollowUps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No overdue follow-ups - Great job!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FollowUpManager;