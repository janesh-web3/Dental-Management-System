import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientAppointments } from "@/utils/patientAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";

const AppointmentCard = ({ appointment }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{appointment.type}</h3>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{format(new Date(appointment.date), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              <span>{format(new Date(appointment.date), "h:mm a")}</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span>{appointment.doctorName}</span>
            </div>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const PatientAppointments = () => {
  const { patientDetails } = usePatientAuthContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (patientDetails && patientDetails._id) {
        setLoading(true);
        try {
          const response = await getPatientAppointments(patientDetails._id);
          if (response.success) {
            setAppointments(response.appointments);
          }
        } catch (error) {
          console.error("Error fetching appointments:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [patientDetails]);

  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === "upcoming"
  );
  
  const pastAppointments = appointments.filter(
    (appointment) => appointment.status === "completed" || appointment.status === "cancelled"
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Appointments</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your upcoming and past dental appointments
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {loading ? (
            <p>Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  You don't have any upcoming appointments.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {loading ? (
            <p>Loading appointments...</p>
          ) : pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  You don't have any past appointments.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientAppointments;
