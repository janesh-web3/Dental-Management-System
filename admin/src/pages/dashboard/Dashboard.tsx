import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Stethoscope, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reports } from "./Reports";
import { FinancialInsights } from "./FinancialInsights";

interface DashboardData {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  appointmentStatus: {
    scheduled: number;
    completed: number;
    canceled: number;
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
    _id: string;
    doctorName: string;
    name: string;
    totalAppointments: number;
    completedAppointments: number;
    appointments: number;
    completionRate: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export function Dashboard() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date(),
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      });
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<{ data: DashboardData }>(
          "GET",
          `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
        );
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "daily" | "weekly" | "monthly") => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.patientGrowth && dashboardData.patientGrowth.length > 1 ? (
                <span className="flex items-center">
                  {dashboardData.patientGrowth[dashboardData.patientGrowth.length - 1].count >
                   dashboardData.patientGrowth[dashboardData.patientGrowth.length - 2].count ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(
                    ((dashboardData.patientGrowth[dashboardData.patientGrowth.length - 1].count -
                      dashboardData.patientGrowth[dashboardData.patientGrowth.length - 2].count) /
                      dashboardData.patientGrowth[dashboardData.patientGrowth.length - 2].count) *
                      100
                  ).toFixed(1)}% from last period
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.appointmentStatus ? (
                <span>
                  {dashboardData.appointmentStatus.completed} completed
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.doctorPerformance ? (
                <span>
                  {dashboardData.doctorPerformance.length} active
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointment Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.appointmentStatus ? (
                <span>
                  {Math.round(
                    (dashboardData.appointmentStatus.completed /
                      (dashboardData.appointmentStatus.completed +
                        dashboardData.appointmentStatus.scheduled +
                        dashboardData.appointmentStatus.canceled)) *
                      100
                  )}%
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.patientGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), "MMM d")}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value, "Patients"]}
                        labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="Patients"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.appointmentDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {dashboardData?.appointmentDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doctor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.doctorPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="doctorName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
                      <Bar dataKey="completionRate" fill="#82ca9d" name="Completion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>

        <TabsContent value="financials">
          <FinancialInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
} 