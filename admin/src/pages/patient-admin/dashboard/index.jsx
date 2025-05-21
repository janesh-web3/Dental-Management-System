import React, { useEffect, useState } from "react";
import { usePatientAuthContext } from "@/contexts/patientAuthContext";
import { getPatientDashboardOverview } from "@/utils/patientAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, FileText, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PatientDashboard = () => {
  const { patientDetails } = usePatientAuthContext();
  const [dashboardData, setDashboardData] = useState({
    nextAppointment: null,
    activeTreatmentsCount: 0,
    pendingBillsCount: 0,
    totalPendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (patientDetails && patientDetails._id) {
        setLoading(true);
        try {
          const response = await getPatientDashboardOverview(patientDetails._id);
          if (response.success) {
            setDashboardData(response.overview);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [patientDetails]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {patientDetails.name}</h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your dental health and upcoming appointments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Next Appointment Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : dashboardData.nextAppointment ? (
              <div>
                <p className="text-2xl font-bold">
                  {format(new Date(dashboardData.nextAppointment.date), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(dashboardData.nextAppointment.date), "h:mm a")} with{" "}
                  {dashboardData.nextAppointment.doctorName}
                </p>
                <p className="text-sm mt-2">{dashboardData.nextAppointment.type}</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/patient/appointments">View Details</Link>
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xl font-medium">No upcoming appointments</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/patient/appointments">View All</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Treatments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Treatments</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">{dashboardData.activeTreatmentsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.activeTreatmentsCount === 1
                    ? "Treatment in progress"
                    : "Treatments in progress"}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/patient/treatments">View Treatments</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Bills Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">{dashboardData.pendingBillsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.pendingBillsCount === 1 ? "Bill pending" : "Bills pending"}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/patient/bills">View Bills</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Due Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm">Loading...</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">
                  ${dashboardData.totalPendingAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/patient/bills">Pay Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Your recent activity will appear here. Check back after your next appointment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
