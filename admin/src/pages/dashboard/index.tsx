import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  IndianRupee,
  Activity,
  User,
  CheckCircle2,
  FileText,
  Stethoscope,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAdminContext } from "@/contexts/adminContext";
import { RecentTransactions } from "./RecentTransactions";
import { useTranslation } from "react-i18next";
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
import { DateRange } from "react-day-picker";
import { server } from "@/server";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reports } from "./Reports";
import { FinancialInsights } from "./FinancialInsights";

interface DoctorAnalysis {
  _id: string;
  doctorName: string;
  appointments: number;
  completionRate: number;
  name: string;
  totalAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  averageRating: number;
  specialization: string;
  experience: number;
  status: string;
  patientsCount: number;
  treatmentsCompleted: number;
  revenue: number;
  performanceRate: number;
}

interface TreatmentDocument {
  name: string;
  url: string;
  type: string;
}

interface RecentTreatment {
  patientName: string;
  treatment: string;
  date: string;
  status: string;
  amount: number;
  documents?: TreatmentDocument[];
}

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
  doctorPerformance: Array<DoctorAnalysis>;
  todayAppointmentsCount: number;
  today: {
    appointments: Array<{
      id: string;
      patientName: string;
      time: string;
      status: string;
    }>;
    revenue: number;
    newPatients: number;
  };
  financialAnalysis: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
    revenueByDoctor: Array<{
      doctorName: string;
      revenue: number;
    }>;
    revenueByTreatment: Array<{
      treatmentType: string;
      revenue: number;
    }>;
    revenueTrend: Array<{
      date: string;
      revenue: number;
    }>;
    paymentMethods: Array<{
      method: string;
      amount: number;
    }>;
    profitMargin: number;
    averageTransactionValue: number;
  };
  analytics: {
    patientDemographics: {
      ageGroups: Array<{
        range: string;
        count: number;
      }>;
      genderDistribution: Array<{
        gender: string;
        count: number;
      }>;
    };
    appointmentAnalytics: {
      byDay: Array<{
        day: string;
        count: number;
      }>;
      byTime: Array<{
        hour: string;
        count: number;
      }>;
    };
    treatmentAnalytics: Array<{
      treatment: string;
      count: number;
    }>;
    recentTreatments: Array<RecentTreatment>;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

const Dashboard = () => {
  const { adminDetails } = useAdminContext();
  const { t } = useTranslation();

  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2020, 0, 1),
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
      setIsCustomDateRange(true);
    }
  };

  const handleResetDateRange = () => {
    setDateRange({
      from: new Date(2020, 0, 1),
      to: new Date()
    });
    setIsCustomDateRange(false);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await crudRequest(
          "GET",
          `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
        ) as { data: DashboardData };
        
        console.log('Dashboard data received:', response);
        console.log('Total doctors:', response.data?.totalDoctors);
        console.log('Doctor performance data:', response.data?.doctorPerformance);
        
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
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("Dashboard")}</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          {isCustomDateRange && (
            <Button 
              variant="outline" 
              onClick={handleResetDateRange}
              size="sm"
            >
              {t("All Time Data")}
            </Button>
          )}
          <Select
            value={viewMode}
            onValueChange={(value: "daily" | "weekly" | "monthly") => setViewMode(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("Daily")}</SelectItem>
              <SelectItem value="weekly">{t("Weekly")}</SelectItem>
              <SelectItem value="monthly">{t("Monthly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        {isCustomDateRange ? (
          <p>
            {t("Showing data from")} {format(dateRange.from, "MMM d, yyyy")} {t("to")} {format(dateRange.to, "MMM d, yyyy")}
          </p>
        ) : (
          <p>{t("Showing all-time data")}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Total Patients")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {t("Active patients in the system")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Total Doctors")}</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              {t("Active doctors in the system")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Total Appointments")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {t("Appointments in selected period")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("Total Revenue")}</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{dashboardData?.financialAnalysis.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Total revenue in selected period")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("Analytics")}</TabsTrigger>
          <TabsTrigger value="appointments">{t("Appointments")}</TabsTrigger>
          <TabsTrigger value="doctors">{t("Doctors")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("Transactions")}</TabsTrigger>
          <TabsTrigger value="reports">{t("Reports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t("Financial Overview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("Daily Revenue")}</p>
                    <p className="text-2xl font-bold">₹{dashboardData?.financialAnalysis.daily.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("Weekly Revenue")}</p>
                    <p className="text-2xl font-bold">₹{dashboardData?.financialAnalysis.weekly.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("Monthly Revenue")}</p>
                    <p className="text-2xl font-bold">₹{dashboardData?.financialAnalysis.monthly.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("Total Revenue")}</p>
                    <p className="text-2xl font-bold">₹{dashboardData?.financialAnalysis.total.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData?.financialAnalysis.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("Recent Treatment Documents")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map((treatment, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{treatment.patientName}</p>
                          <p className="text-sm text-muted-foreground">{treatment.treatment}</p>
                        </div>
                        <Badge variant={treatment.status === "Completed" ? "default" : "secondary"}>
                          {treatment.status}
                        </Badge>
                      </div>
                      {treatment.documents && treatment.documents.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {treatment.documents.map((doc, docIndex) => (
                            <Button
                              key={docIndex}
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                {doc.name}
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Doctor Performance")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!dashboardData?.doctorPerformance || dashboardData.doctorPerformance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg text-muted-foreground">No doctor data available</p>
                  <p className="text-sm text-muted-foreground mt-2">Create doctors in the system to view performance analytics</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dashboardData.doctorPerformance.map((doctor) => (
                    <Card key={doctor._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{doctor.doctorName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          </div>
                          <Avatar>
                            <User className="h-6 w-6" />
                          </Avatar>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Completed Appointments")}
                            </p>
                            <p className="text-2xl font-bold">{doctor.completedAppointments}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Patients Treated")}
                            </p>
                            <p className="text-2xl font-bold">{doctor.patientsCount}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Performance Rate")}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress value={doctor.performanceRate} className="h-2" />
                              <span className="text-sm font-medium">{doctor.performanceRate}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("Today's Appointments")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.today.appointments.map((appointment) => (
                    <div key={appointment.id} className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.time}</p>
                      </div>
                      <Badge variant={appointment.status === "Completed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Recent Treatments")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map((treatment, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{treatment.patientName}</p>
                          <p className="text-sm text-muted-foreground">{treatment.treatment}</p>
                          <p className="text-sm text-muted-foreground">{treatment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{treatment.amount}</p>
                          <Badge variant={treatment.status === "Completed" ? "default" : "secondary"}>
                            {treatment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("Doctor Progress")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!dashboardData?.doctorPerformance || dashboardData.doctorPerformance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg text-muted-foreground">No doctor data available</p>
                  <p className="text-sm text-muted-foreground mt-2">Create doctors in the system to view progress data</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dashboardData.doctorPerformance.map((doctor) => (
                    <Card key={doctor._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{doctor.doctorName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          </div>
                          <Avatar>
                            <User className="h-6 w-6" />
                          </Avatar>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Patients Treated")}
                            </p>
                            <p className="text-2xl font-bold">{doctor.patientsCount}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Treatments Completed")}
                            </p>
                            <p className="text-2xl font-bold">{doctor.treatmentsCompleted}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {t("Performance Rate")}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress value={doctor.performanceRate} className="h-2" />
                              <span className="text-sm font-medium">{doctor.performanceRate}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <RecentTransactions />
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
