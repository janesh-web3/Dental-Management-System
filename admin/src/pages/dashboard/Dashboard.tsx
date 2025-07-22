import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Stethoscope, Clock, TrendingUp, TrendingDown, Database, RefreshCw, Activity } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface DetailedDatabaseData {
  patients: any[];
  doctors: any[];
  appointments: any[];
  servicePayments: any[];
  expenses: any[];
  income: any[];
  notifications: any[];
  smsHistory: any[];
  invoices: any[];
  rawStats: {
    totalRecords: number;
    lastUpdated: string;
    collections: Record<string, number>;
  };
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
  const [detailedData, setDetailedData] = useState<DetailedDatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showRawData, setShowRawData] = useState(false);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      });
    }
  };

  const fetchDetailedDatabaseData = async () => {
    setDetailedLoading(true);
    try {
      // Fetch all database collections with individual error handling
      const fetchWithErrorHandling = async (url: string, name: string) => {
        try {
          return await crudRequest("GET", url);
        } catch (error) {
          console.warn(`Failed to fetch ${name}:`, error);
          return { data: [] };
        }
      };

      const [
        patientsRes,
        doctorsRes,
        appointmentsRes,
        servicePaymentsRes,
        expensesRes,
        incomeRes,
        notificationsRes,
        smsHistoryRes,
        invoicesRes
      ] = await Promise.all([
        fetchWithErrorHandling(`${server}/patient/get-patient`, 'patients'),
        fetchWithErrorHandling(`${server}/doctor/get-doctor`, 'doctors'),
        fetchWithErrorHandling(`${server}/appointment/get-appointments`, 'appointments'),
        fetchWithErrorHandling(`${server}/service-payment`, 'service payments'),
        fetchWithErrorHandling(`${server}/finance/expense`, 'expenses'),
        fetchWithErrorHandling(`${server}/finance/income`, 'income'),
        fetchWithErrorHandling(`${server}/notifications`, 'notifications'),
        fetchWithErrorHandling(`${server}/sms/history`, 'SMS history'),
        fetchWithErrorHandling(`${server}/invoices`, 'invoices')
      ]) as [
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] },
        { data?: any[] }
      ];

      const collections = {
        patients: patientsRes.data?.length || 0,
        doctors: doctorsRes.data?.length || 0,
        appointments: appointmentsRes.data?.length || 0,
        servicePayments: servicePaymentsRes.data?.length || 0,
        expenses: expensesRes.data?.length || 0,
        income: incomeRes.data?.length || 0,
        notifications: notificationsRes.data?.length || 0,
        smsHistory: smsHistoryRes.data?.length || 0,
        invoices: invoicesRes.data?.length || 0,
      };

      const totalRecords = Object.values(collections).reduce((sum, count) => sum + count, 0);

      setDetailedData({
        patients: (patientsRes as { data?: any[] }).data || [],
        doctors: (doctorsRes as { data?: any[] }).data || [],
        appointments: (appointmentsRes as { data?: any[] }).data || [],
        servicePayments: (servicePaymentsRes as { data?: any[] }).data || [],
        expenses: (expensesRes as { data?: any[] }).data || [],
        income: (incomeRes as { data?: any[] }).data || [],
        notifications: (notificationsRes as { data?: any[] }).data || [],
        smsHistory: (smsHistoryRes as { data?: any[] }).data || [],
        invoices: (invoicesRes as { data?: any[] }).data || [],
        rawStats: {
          totalRecords,
          lastUpdated: new Date().toISOString(),
          collections
        }
      });
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error fetching detailed database data:", error);
    } finally {
      setDetailedLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchDetailedDatabaseData()
    ]);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{ data: DashboardData }>(
        "GET",
        `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      );
      console.log("Dashboard data fetched:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDetailedDatabaseData();
  }, [dateRange]);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, dateRange]);

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
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Real-time</span>
          </Badge>
          {detailedData && (
            <Badge variant="secondary">
              {detailedData.rawStats.totalRecords} Total Records
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-1"
          >
            <Activity className={`h-3 w-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span>{autoRefresh ? 'Live' : 'Manual'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading || detailedLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-3 w-3 ${(loading || detailedLoading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant={showRawData ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center space-x-1"
          >
            <Database className="h-3 w-3" />
            <span>Raw Data</span>
          </Button>
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

      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {format(lastRefreshed, "MMM d, yyyy HH:mm:ss")}
          </span>
          {autoRefresh && (
            <Badge variant="outline" className="animate-pulse">
              Auto-refreshing every 30s
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {detailedLoading && (
            <Badge variant="secondary">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Loading...
            </Badge>
          )}
          <Badge variant="outline">
            {showRawData ? 'Showing Raw Database Data' : 'Showing Dashboard View'}
          </Badge>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
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

        <TabsContent value="database" className="space-y-4">
          {detailedData ? (
            <>
              {/* Database Overview Cards */}
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {Object.entries(detailedData.rawStats.collections).map(([collection, count]) => (
                  <Card key={collection}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium capitalize">
                        {collection.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground">records</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Raw Data Display */}
              {showRawData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Raw Database Data</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(detailedData).map(([key, data]) => {
                      if (key === 'rawStats') return null;
                      return (
                        <Card key={key}>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[400px]">
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(data, null, 2)}
                              </pre>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading database information...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          {detailedData?.patients ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Patient Details</h3>
                <Badge variant="secondary">{detailedData.patients.length} patients</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {detailedData.patients.slice(0, 9).map((patient: any, index: number) => (
                  <Card key={patient._id || index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {patient.personalDetails?.name || `Patient ${index + 1}`}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit">
                        ID: {patient._id?.slice(-6) || 'N/A'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs space-y-1">
                        <p><strong>Gender:</strong> {patient.personalDetails?.gender || 'N/A'}</p>
                        <p><strong>Contact:</strong> {patient.personalDetails?.contactNumber || 'N/A'}</p>
                        <p><strong>Email:</strong> {patient.personalDetails?.emailAddress || 'N/A'}</p>
                        <p><strong>Created:</strong> {patient.createdAt ? format(new Date(patient.createdAt), "MMM d, yyyy") : 'N/A'}</p>
                        <p><strong>Medical Details:</strong> {patient.medicalDetails?.length || 0} records</p>
                        <p><strong>Deleted:</strong> {patient.isDeleted ? 'Yes' : 'No'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {detailedData.patients.length > 9 && (
                <p className="text-center text-sm text-muted-foreground">
                  Showing first 9 of {detailedData.patients.length} patients
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading patient data...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Refresh</span>
                  <Badge variant={autoRefresh ? "default" : "secondary"}>
                    {autoRefresh ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Update Frequency</span>
                  <Badge variant="outline">30 seconds</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-xs text-muted-foreground">
                    {format(lastRefreshed, "HH:mm:ss")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Records</span>
                  <Badge variant="secondary">
                    {detailedData?.rawStats.totalRecords || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Collection Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detailedData?.rawStats.collections ? (
                  <div className="space-y-2">
                    {Object.entries(detailedData.rawStats.collections).map(([collection, count]) => (
                      <div key={collection} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {collection.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading statistics...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Data Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {detailedData?.patients?.slice(0, 5).map((patient: any, index: number) => (
                    <div key={patient._id || index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{patient.personalDetails?.name || `Patient ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {patient.createdAt ? format(new Date(patient.createdAt), "MMM d, HH:mm") : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="outline">Patient</Badge>
                    </div>
                  ))}
                  {detailedData?.doctors?.slice(0, 3).map((doctor: any, index: number) => (
                    <div key={doctor._id || index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{doctor.name || `Doctor ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Specialization: {doctor.specialization || 'General'}
                        </p>
                      </div>
                      <Badge variant="outline">Doctor</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
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