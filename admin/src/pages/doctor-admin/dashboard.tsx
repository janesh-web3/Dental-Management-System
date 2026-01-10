import React, { useState, useEffect } from 'react';
import { crudRequest } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar, Users, Activity, Clock, DollarSign, TrendingUp, Search, ArrowUpDown } from "lucide-react";
import { useDoctorAuthContext } from '@/contexts/doctorAuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ViewPatientDrawer } from '@/components/patient/ViewPatientDrawer';
import type { Patient } from '@/types/patient';

interface Appointment {
  _id: string;
  firstName: string;
  lastName: string;
  appointmentDate: string;
  appointmentTime: string;
  subject: string;
  status: string;
}

interface PatientHistoryItem {
  patientId: string;
  patientName: string;
  treatmentName: string;
  treatmentDate: string;
  status: string;
  toothNumber: string;
  notes: string;
  amountPaid: number;
  remainingAmount: number;
  nextFollowUp: string | null;
  nextAppointment: string | null;
  patient: any;
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
  treatmentMetrics: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  revenueMetrics: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  charts: {
    revenueTrend: Array<{ month: string; revenue: number }>;
    treatmentTrend: Array<{ month: string; treatments: number }>;
  };
}

/**
 * Enhanced dashboard component for doctors with modern UI and analytics
 */
const Dashboard: React.FC = () => {
  const { doctorDetails } = useDoctorAuthContext();
  const doctorId = doctorDetails?._id || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedMetricPeriod, setSelectedMetricPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Patient History State
  const [patientHistory, setPatientHistory] = useState<PatientHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'amount'>('date');

  // ViewPatientDrawer State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<{
          success: boolean;
          data: DashboardData;
        }>('GET', `/doctor-admin/dashboard/${doctorId}`);

        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
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

  useEffect(() => {
    const fetchPatientHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await crudRequest<{
          success: boolean;
          data: {
            patientHistory: PatientHistoryItem[];
            totalPages: number;
            currentPage: number;
            totalRecords: number;
          };
        }>('GET', `/doctor-admin/patient-history/${doctorId}?page=${currentPage}&limit=10&search=${searchTerm}&sortBy=${sortBy}`);

        if (response.success && response.data) {
          setPatientHistory(response.data.patientHistory || []);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching patient history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (doctorId) {
      fetchPatientHistory();
    }
  }, [doctorId, currentPage, searchTerm, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {doctorDetails?.name}</p>
      </div>

      {/* Metric Selector */}
      <Tabs value={selectedMetricPeriod} onValueChange={(value) => setSelectedMetricPeriod(value as any)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Enhanced Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Treatments Done Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatments Done</CardTitle>
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {dashboardData?.treatmentMetrics[selectedMetricPeriod] || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMetricPeriod === 'today' && 'Treatments completed today'}
              {selectedMetricPeriod === 'week' && 'Treatments this week'}
              {selectedMetricPeriod === 'month' && 'Treatments this month'}
              {selectedMetricPeriod === 'year' && 'Treatments this year'}
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(dashboardData?.revenueMetrics[selectedMetricPeriod] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMetricPeriod === 'today' && 'Revenue earned today'}
              {selectedMetricPeriod === 'week' && 'Revenue this week'}
              {selectedMetricPeriod === 'month' && 'Revenue this month'}
              {selectedMetricPeriod === 'year' && 'Revenue this year'}
            </p>
          </CardContent>
        </Card>

        {/* Total Patients Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {dashboardData?.patientSummary.totalPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.patientSummary.checkedPatients || 0} patients checked
            </p>
          </CardContent>
        </Card>

        {/* Today's Appointments Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {dashboardData?.statistics.appointmentsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.statistics.upcomingAppointmentsCount || 0} upcoming this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue for the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Treatment Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Treatment Trend
            </CardTitle>
            <CardDescription>Monthly treatments for the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.charts.treatmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="treatments" fill="#3b82f6" name="Treatments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patient History Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Patient Treatment History</CardTitle>
              <CardDescription>View all patients you have treated</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const sortOrder: ('date' | 'name' | 'amount')[] = ['date', 'name', 'amount'];
                  const currentIndex = sortOrder.indexOf(sortBy);
                  setSortBy(sortOrder[(currentIndex + 1) % sortOrder.length]);
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : patientHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Next Follow-Up</TableHead>
                    <TableHead>Next Appointment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientHistory.map((item, index) => (
                    <TableRow key={`${item.patientId}-${index}`}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => {
                            if (item.patient) {
                              setSelectedPatient(item.patient);
                              setIsViewDrawerOpen(true);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                          {item.patientName || 'N/A'}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.treatmentName || 'N/A'}</div>
                          {item.toothNumber && item.toothNumber !== "N/A" && (
                            <div className="text-xs text-muted-foreground">
                              Tooth: {item.toothNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(item.treatmentDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Completed" ? "default" : "secondary"}>
                          {item.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amountPaid || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={(item.remainingAmount || 0) > 0 ? "text-red-600" : "text-green-600"}>
                          {formatCurrency(item.remainingAmount || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(item.nextFollowUp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(item.nextAppointment)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No patient history found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Appointments
            </CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.todayAppointments && dashboardData.todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.todayAppointments.map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{appointment.firstName} {appointment.lastName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{appointment.appointmentTime}</p>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your schedule for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="flex items-center justify-between border-b pb-3 last:border-0">
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

      {/* ViewPatientDrawer component */}
      {selectedPatient && (
        <ViewPatientDrawer
          patient={selectedPatient}
          isOpen={isViewDrawerOpen}
          onClose={() => {
            setIsViewDrawerOpen(false);
            setSelectedPatient(null);
          }}
          isDoctorView={true}
        />
      )}
    </div>
  );
};

export default Dashboard;
