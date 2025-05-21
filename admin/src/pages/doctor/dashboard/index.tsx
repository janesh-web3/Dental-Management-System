import React, { useEffect, useState } from "react";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ClipboardList, User, Users } from "lucide-react";
import { getDoctorDashboardOverview, DashboardOverview } from "@/services/doctorService";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const DoctorDashboard: React.FC = () => {
  const { doctorDetails } = useDoctorAuthContext();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!doctorDetails._id) return;
      
      try {
        setLoading(true);
        const data = await getDoctorDashboardOverview(doctorDetails._id);
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [doctorDetails._id]);

  // Format appointment date and time
  const formatAppointmentTime = (date: string, time: string) => {
    if (!date || !time) return "";
    return `${time} - ${format(new Date(date), "MMM d, yyyy")}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, Dr. {doctorDetails.name}</h1>
        <p className="text-muted-foreground">
          {doctorDetails.specialization || "Dental Specialist"} | Dashboard Overview
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-2"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.patientSummary?.totalPatients || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.patientSummary?.checkedPatients || 0} patients checked
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.statistics?.appointmentsToday || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.todayAppointments?.filter(a => a.status === "Pending").length || 0} pending confirmations
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Treatments In Progress</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.treatmentsInProgress || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires your attention
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Treatments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardData?.statistics?.completedTreatments || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total completed treatments
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.slice(0, 5).map((appointment, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{appointment.firstName} {appointment.lastName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAppointmentTime(appointment.appointmentDate, appointment.appointmentTime)} - {appointment.subject}
                      </p>
                    </div>
                    <div className="ml-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === "Accepted" ? "bg-green-100 text-green-800" : appointment.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No upcoming appointments
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : dashboardData?.todayAppointments && dashboardData.todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.todayAppointments.slice(0, 5).map((appointment, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{appointment.firstName} {appointment.lastName}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === "Accepted" ? "bg-green-100 text-green-800" : appointment.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm">
                        {appointment.appointmentTime} - {appointment.subject}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {appointment.contactNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No appointments for today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
