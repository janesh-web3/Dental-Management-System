import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar, Users, Activity, Clock, TrendingUp, CheckCircle } from "lucide-react";

interface DashboardProps {
  doctorId: string;
}

interface Appointment {
  _id: string;
  firstName: string;
  lastName: string;
  appointmentDate: string;
  appointmentTime: string;
  subject: string;
  status: string;
}

interface DashboardData {
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  patientSummary: {
    totalPatients: number;
    checkedPatients: number;
  };
  treatmentsInProgress: number;
  statistics: {
    totalAppointments: number;
    completedTreatments: number;
    appointmentsToday: number;
    upcomingAppointmentsCount: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ doctorId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/doctor-admin/dashboard/${doctorId}`);
        setDashboardData(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDashboardData();
    }
  }, [doctorId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Quick Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.statistics.totalAppointments || 0}</div>
          <p className="text-xs text-muted-foreground">
            All time appointments
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.patientSummary.totalPatients || 0}</div>
          <p className="text-xs text-muted-foreground">
            {dashboardData?.patientSummary.checkedPatients || 0} patients checked
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Treatments In Progress</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.treatmentsInProgress || 0}</div>
          <p className="text-xs text-muted-foreground">
            {dashboardData?.statistics.completedTreatments || 0} completed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.statistics.appointmentsToday || 0}</div>
          <p className="text-xs text-muted-foreground">
            {dashboardData?.statistics.upcomingAppointmentsCount || 0} upcoming this week
          </p>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>
            Your schedule for today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.todayAppointments && dashboardData.todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.todayAppointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{appointment.firstName} {appointment.lastName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{appointment.appointmentTime}</p>
                    <Badge variant={appointment.status === "Accepted" ? "default" : appointment.status === "Rejected" ? "destructive" : "outline"}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No appointments scheduled for today</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your schedule for the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingAppointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{appointment.firstName} {appointment.lastName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{appointment.appointmentDate}</p>
                      <p className="text-xs text-muted-foreground">{appointment.appointmentTime}</p>
                    </div>
                    <Badge variant={appointment.status === "Accepted" ? "default" : appointment.status === "Rejected" ? "destructive" : "outline"}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No upcoming appointments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
