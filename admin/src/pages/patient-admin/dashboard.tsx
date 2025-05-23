import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Receipt, FileText, Bell, Clock, User, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PageTitle from "@/components/shared/page-title.tsx";
import { crudRequest } from "@/utils/api";

// Define types for the data
interface Appointment {
  _id: string;
  appointmentDate: string;
  status: string;
  doctorId?: {
    _id: string;
    name: string;
    specialization?: string;
  };
  treatmentType?: string;
  notes?: string;
}

interface Bill {
  _id: string;
  date: string;
  amount: number;
  status: string;
  description?: string;
  treatmentId?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  isCompleted?: boolean;
}

interface Message {
  _id: string;
  id?: string; // Some responses might use id instead of _id
  date: string;
  subject: string;
  content: string;
  isRead: boolean;
  sender: string;
  title?: string; // Some responses might include a title
  doctorName?: string; // Doctor who sent the message
  doctorSpecialization?: string; // Doctor's specialization
}

const PatientDashboard: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState({
    appointments: true,
    bills: true,
    messages: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (patientDetails._id) {
        try {
          // Fetch appointments using crudRequest
          const appointmentsResponse = await crudRequest<{success: boolean; appointments: Appointment[]}>(
            'GET',
            `/patient/${patientDetails._id}/appointments`
          );
          
          if (appointmentsResponse.success && appointmentsResponse.data?.appointments) {
            setAppointments(appointmentsResponse.data.appointments);
          }
          setLoading(prev => ({ ...prev, appointments: false }));

          // Fetch bills using crudRequest
          const billsResponse = await crudRequest<{success: boolean; bills: Bill[]}>(
            'GET',
            `/patient/${patientDetails._id}/bills`
          );
          
          if (billsResponse.success && billsResponse.data?.bills) {
            setBills(billsResponse.data.bills);
          }
          setLoading(prev => ({ ...prev, bills: false }));

          // Fetch messages using crudRequest
          const messagesResponse = await crudRequest<{success: boolean; messages: Message[]}>(
            'GET',
            `/patient/${patientDetails._id}/messages`
          );
          
          if (messagesResponse.success && messagesResponse.data?.messages) {
            setMessages(messagesResponse.data.messages);
          }
          setLoading(prev => ({ ...prev, messages: false }));
        } catch (error) {
          console.error("Error fetching patient data:", error);
          setLoading({
            appointments: false,
            bills: false,
            messages: false,
          });
        }
      }
    };

    fetchData();
  }, [patientDetails._id]);

  // Filter upcoming appointments
  const upcomingAppointments = appointments
    .filter(appointment => new Date(appointment.appointmentDate) >= new Date())
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 3);

  // Filter recent bills
  const recentBills = bills
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Filter recent messages
  const recentMessages = messages
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="container p-4 md:p-6 max-w-7xl mx-auto">
      <PageTitle 
        heading={`Welcome, ${patientDetails.name}`}
        text="Manage your appointments, treatments, and billing information"
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/patient/appointments">View All Appointments</Link>
          </Button>
          <Button asChild>
            <Link to="/patient/profile">Manage Profile</Link>
          </Button>
        </div>
      </PageTitle>

      {/* Patient Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{patientDetails.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{patientDetails.contactNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{patientDetails.email}</span>
            </div>
            {patientDetails.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{patientDetails.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Bills</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Messages</span>
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled dental appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.appointments ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(new Date(appointment.appointmentDate), "PPP")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointmentDate), "p")}
                          </span>
                        </div>
                        {appointment.doctorId && (
                          <div className="text-sm mt-1">
                            Dr. {appointment.doctorId.name}
                            {appointment.doctorId.specialization && (
                              <span className="text-muted-foreground ml-1">
                                ({appointment.doctorId.specialization})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant={appointment.status === "confirmed" ? "default" : "outline"}>
                        {appointment.status || "Scheduled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming appointments scheduled
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bills</CardTitle>
              <CardDescription>Your recent treatment bills</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.bills ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : recentBills.length > 0 ? (
                <div className="space-y-4">
                  {recentBills.map((bill, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {bill.date ? format(new Date(bill.date), "PPP") : "N/A"}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-medium">₹{(bill.totalAmount || bill.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Paid: </span>
                          <span className="font-medium">₹{(bill.paidAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div>
                        <Badge variant={bill.isCompleted ? "default" : "outline"}>
                          {bill.isCompleted ? "Paid" : `₹${(bill.remainingAmount || bill.amount || 0).toFixed(2)} Due`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No billing records found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Messages from your doctor</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.messages ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium">{message.title}</span>
                          {!message.isRead && (
                            <Badge variant="default" className="ml-2">New</Badge>
                          )}
                        </div>
                        <div className="text-sm mt-1">
                          <span className="text-muted-foreground">From: </span>
                          <span className="font-medium">Dr. {message.doctorName}</span>
                          {message.doctorSpecialization && (
                            <span className="text-muted-foreground ml-1">
                              ({message.doctorSpecialization})
                            </span>
                          )}
                        </div>
                        <div className="text-sm mt-1 text-muted-foreground">
                          {format(new Date(message.date), "PPP")}
                        </div>
                        <div className="text-sm mt-2 line-clamp-2">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No messages found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDashboard;
