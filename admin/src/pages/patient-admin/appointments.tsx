import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientAppointments } from "@/utils/patientAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, isToday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatientAppointments: React.FC = () => {
  const { patientDetails } = usePatientAuthContext();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      if (patientDetails._id) {
        try {
          setLoading(true);
          const response = await getPatientAppointments(patientDetails._id);
          if (response.success && response.appointments) {
            setAppointments(response.appointments);
          } else {
            setError(response.message || "Failed to fetch appointments");
          }
        } catch (error) {
          console.error("Error fetching appointments:", error);
          setError("An error occurred while fetching appointments");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [patientDetails._id]);

  // Filter appointments by status
  const upcomingAppointments = appointments.filter(
    (appointment) => isAfter(new Date(appointment.appointmentDate), new Date()) || isToday(new Date(appointment.appointmentDate))
  );
  
  const pastAppointments = appointments.filter(
    (appointment) => isBefore(new Date(appointment.appointmentDate), new Date()) && !isToday(new Date(appointment.appointmentDate))
  );

  // Sort appointments by date
  const sortedUpcoming = [...upcomingAppointments].sort(
    (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );
  
  const sortedPast = [...pastAppointments].sort(
    (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );

  const renderAppointmentCard = (appointment: any) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const isUpcoming = isAfter(appointmentDate, new Date()) || isToday(appointmentDate);
    
    return (
      <Card key={appointment._id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium text-lg">
                  {format(appointmentDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(appointmentDate, "h:mm a")}
                </span>
              </div>
              
              {appointment.doctorId && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">Doctor: </span>
                    {appointment.doctorId.name}
                    {appointment.doctorId.specialization && (
                      <span className="text-muted-foreground ml-1">
                        ({appointment.doctorId.specialization})
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {appointment.reason && (
                <div className="mt-2">
                  <span className="font-medium">Reason: </span>
                  <span>{appointment.reason}</span>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-2">
                  <span className="font-medium">Notes: </span>
                  <span>{appointment.notes}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-start md:items-end">
              <Badge 
                variant={
                  appointment.status === "confirmed" 
                    ? "default" 
                    : appointment.status === "cancelled" 
                    ? "destructive" 
                    : "outline"
                }
                className="mb-2"
              >
                {appointment.status || "Scheduled"}
              </Badge>
              
              {isUpcoming && (
                <div className="text-sm text-muted-foreground mt-2">
                  {isToday(appointmentDate) 
                    ? "Today" 
                    : `In ${Math.ceil((appointmentDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">You don't have any appointments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({sortedUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({sortedPast.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {sortedUpcoming.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">You don't have any upcoming appointments.</p>
                </CardContent>
              </Card>
            ) : (
              sortedUpcoming.map(renderAppointmentCard)
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {sortedPast.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">You don't have any past appointments.</p>
                </CardContent>
              </Card>
            ) : (
              sortedPast.map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PatientAppointments;
