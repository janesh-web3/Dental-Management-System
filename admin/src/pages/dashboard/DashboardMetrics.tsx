import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, Users, Calendar, UserCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";
import { CSVLink } from "react-csv";
import { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardMetrics {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  appointmentStats: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  patientGrowth: Array<{
    date: string;
    count: number;
  }>;
  appointmentDistribution: Array<{
    status: string;
    count: number;
  }>;
  doctorPerformance: Array<{
    doctorName: string;
    appointments: number;
    completedAppointments: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function DashboardMetrics() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{ data: DashboardMetrics }>(
        "GET",
        `${server}/user/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      );
      setMetrics(response.data);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Prepare data for CSV export
    const csvData = metrics?.patientGrowth.map((item) => ({
      Date: format(new Date(item.date), "yyyy-MM-dd"),
      "New Patients": item.count,
    })) || [];
    return csvData;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalDoctors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Accepted</span>
                </div>
                <span className="text-sm font-medium">{metrics?.appointmentStats.accepted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">{metrics?.appointmentStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="text-sm font-medium">{metrics?.appointmentStats.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Reports & Analytics</CardTitle>
          <div className="flex items-center space-x-2">
            <DateRangePicker
              value={dateRange}
              onChange={(range: DateRange | undefined) => {
                if (range?.from) {
                  setDateRange({
                    from: range.from,
                    to: range.to || range.from
                  });
                }
              }}
            />
            <CSVLink
              data={handleExportCSV()}
              filename={`dashboard-report-${format(new Date(), "yyyy-MM-dd")}.csv`}
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CSVLink>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patient-growth" className="space-y-4">
            <TabsList>
              <TabsTrigger value="patient-growth">Patient Growth</TabsTrigger>
              <TabsTrigger value="appointment-distribution">Appointment Distribution</TabsTrigger>
              <TabsTrigger value="doctor-performance">Doctor Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="patient-growth" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, "New Patients"]}
                      labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="appointment-distribution" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.appointmentDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {metrics?.appointmentDistribution.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="doctor-performance" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.doctorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="doctorName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#8884d8" name="Total Appointments" />
                    <Bar dataKey="completedAppointments" fill="#82ca9d" name="Completed Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 