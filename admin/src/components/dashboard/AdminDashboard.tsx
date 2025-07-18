import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  FileText,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  UserCheck,
  BarChart3,
  PieChart,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { crudRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { server } from "@/server";
import { Analytics } from "@/pages/dashboard/Analytics";
import { RecentTransactions } from "@/pages/dashboard/RecentTransactions";
import { motion } from "framer-motion";
import { useAdminContext } from "@/contexts/adminContext";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface AdminDashboardData {
  overview: {
    totalPatients: number;
    totalDoctors: number;
    totalUsers: number;
    monthlyPatients: number;
    todayAppointmentsCount: number;
    appointmentStats: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
    };
  };
  appointments: {
    today: Array<{
      _id: string;
      patientName: string;
      appointmentTime: string;
      status: string;
      doctor: { name: string };
    }>;
    upcoming: Array<{
      _id: string;
      patientName: string;
      appointmentDate: string;
      status: string;
      doctor: { name: string };
    }>;
  };
  analytics: {
    topTreatments: Array<{
      _id: string;
      count: number;
    }>;
    recentTreatments: Array<{
      patientName: string;
      treatment: string;
      date: string;
      amount: number;
    }>;
    doctorAnalysis: Array<{
      _id: string;
      name: string;
      specialization: string;
      totalAppointments: number;
      completedAppointments: number;
      performanceRate: number;
    }>;
    revenueAnalytics: {
      daily: number;
      weekly: number;
      monthly: number;
      total: number;
    };
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    totalServicePayments: number;
    netProfit: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  className: string;
}

const StatCard = ({ title, value, description, icon, className }: StatCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        hover: { scale: 1.05, z: 20, transition: { duration: 0.3 } },
      }}
      className="group"
    >
      <Card className={`relative shadow-lg transition-all ${className} h-[150px] backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div
            className="p-2 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-sm shadow-md"
            variants={{
              hover: { y: -10, x: 5, rotateY: 15, scale: 1.1 },
            }}
          >
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{value}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAdminContext();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<AdminDashboardData>(
          "GET",
          `${server}/user/admin-dashboard`
        );
        setDashboardData(response);
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("Admin Dashboard")}
        </h2>
        <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
          {t("Admin Access")}
        </Badge>
      </div>

      {/* Overview Stats */}
      <motion.div
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatCard
          title={t("Total Patients")}
          value={dashboardData.overview.totalPatients}
          description={t("Active patients in system")}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
        />
        <StatCard
          title={t("Total Doctors")}
          value={dashboardData.overview.totalDoctors}
          description={t("Active doctors in system")}
          icon={<Stethoscope className="h-6 w-6 text-green-600" />}
          className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
        />
        <StatCard
          title={t("Total Users")}
          value={dashboardData.overview.totalUsers}
          description={t("System users (Admin + Staff)")}
          icon={<UserCheck className="h-6 w-6 text-purple-600" />}
          className="bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700"
        />
        <StatCard
          title={t("Monthly Patients")}
          value={dashboardData.overview.monthlyPatients}
          description={t("New patients this month")}
          icon={<Calendar className="h-6 w-6 text-orange-600" />}
          className="bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700"
        />
      </motion.div>

      {/* Financial Overview */}
      {hasPermission('dashboard', 'analytics') && (
        <motion.div
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <StatCard
            title={t("Total Income")}
            value={`₹${dashboardData.financial.totalIncome.toLocaleString()}`}
            description={t("Total revenue generated")}
            icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
            className="bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700"
          />
          <StatCard
            title={t("Total Expenses")}
            value={`₹${dashboardData.financial.totalExpenses.toLocaleString()}`}
            description={t("Total operational costs")}
            icon={<TrendingDown className="h-6 w-6 text-red-600" />}
            className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
          />
          <StatCard
            title={t("Net Profit")}
            value={`₹${dashboardData.financial.netProfit.toLocaleString()}`}
            description={t("Profit after expenses")}
            icon={<Wallet className="h-6 w-6 text-indigo-600" />}
            className="bg-indigo-50 dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700"
          />
          <StatCard
            title={t("Service Payments")}
            value={`₹${dashboardData.financial.totalServicePayments.toLocaleString()}`}
            description={t("Service-based revenue")}
            icon={<FileText className="h-6 w-6 text-teal-600" />}
            className="bg-teal-50 dark:bg-teal-900 border-teal-200 dark:border-teal-700"
          />
        </motion.div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
          <TabsTrigger value="appointments">{t("Appointments")}</TabsTrigger>
          {hasPermission('dashboard', 'analytics') && (
            <TabsTrigger value="analytics">{t("Analytics")}</TabsTrigger>
          )}
          {hasPermission('dashboard', 'reports') && (
            <TabsTrigger value="reports">{t("Reports")}</TabsTrigger>
          )}
          <TabsTrigger value="transactions">{t("Transactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("Today's Appointments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {dashboardData.appointments.today.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.appointmentTime} • Dr. {appointment.doctor.name}
                        </p>
                      </div>
                      <Badge
                        variant={appointment.status === "Accepted" ? "default" : "secondary"}
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Doctor Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("Doctor Performance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {dashboardData.analytics.doctorAnalysis.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doctor.specialization}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{doctor.performanceRate.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doctor.completedAppointments}/{doctor.totalAppointments} appointments
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Appointment Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Appointment Statistics")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t("Total Appointments")}</span>
                    <span className="font-semibold">{dashboardData.overview.appointmentStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("Pending")}</span>
                    <span className="font-semibold text-yellow-600">{dashboardData.overview.appointmentStats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("Accepted")}</span>
                    <span className="font-semibold text-green-600">{dashboardData.overview.appointmentStats.accepted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("Rejected")}</span>
                    <span className="font-semibold text-red-600">{dashboardData.overview.appointmentStats.rejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>{t("Upcoming Appointments")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {dashboardData.appointments.upcoming.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(appointment.appointmentDate), "MMM d, yyyy")} • Dr. {appointment.doctor.name}
                        </p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {hasPermission('dashboard', 'analytics') && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="bg-white dark:bg-gray-950 border rounded-lg p-4">
              <Analytics />
            </div>
          </TabsContent>
        )}

        {hasPermission('dashboard', 'reports') && (
          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    {t("Revenue Analytics")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>{t("Daily Revenue")}</span>
                      <span className="font-semibold">₹{dashboardData.analytics.revenueAnalytics.daily.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Weekly Revenue")}</span>
                      <span className="font-semibold">₹{dashboardData.analytics.revenueAnalytics.weekly.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Monthly Revenue")}</span>
                      <span className="font-semibold">₹{dashboardData.analytics.revenueAnalytics.monthly.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("Total Revenue")}</span>
                      <span className="font-semibold">₹{dashboardData.analytics.revenueAnalytics.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Treatments */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Top Treatments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {dashboardData.analytics.topTreatments.map((treatment, index) => (
                      <div
                        key={treatment._id}
                        className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{treatment._id}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            #{index + 1} Most Popular
                          </p>
                        </div>
                        <Badge variant="outline">{treatment.count} times</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="transactions" className="space-y-4">
          <RecentTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;