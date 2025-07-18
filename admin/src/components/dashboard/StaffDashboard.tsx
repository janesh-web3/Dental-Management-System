import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { crudRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { server } from "@/server";
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

interface StaffDashboardData {
  overview: {
    dailyCollection: number;
    dailyExpenses: number;
    dailyNet: number;
    weeklyCollection: number;
    weeklyExpenses: number;
    weeklyNet: number;
    totalPatients: number;
    totalDoctors: number;
    pendingAppointments: number;
  };
  appointments: {
    today: Array<{
      _id: string;
      patientName: string;
      appointmentTime: string;
      status: string;
      doctor: { name: string };
    }>;
  };
  transactions: {
    todayIncome: number;
    todayExpenses: number;
    weeklyIncome: number;
    weeklyExpenses: number;
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
      <Card className={`relative shadow-lg transition-all ${className} h-[130px] backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div
            className="p-2 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-sm shadow-md"
            variants={{
              hover: { y: -5, x: 3, scale: 1.1 },
            }}
          >
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold mb-1">{value}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StaffDashboard = () => {
  const { t } = useTranslation();
  const { adminDetails } = useAdminContext();
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffDashboard = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<StaffDashboardData>(
          "GET",
          `${server}/user/staff-dashboard`
        );
        setDashboardData(response);
      } catch (error) {
        console.error("Error fetching staff dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDashboard();
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t("Staff Dashboard")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("Welcome back")}, {adminDetails.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
            {t("Staff Access")}
          </Badge>
          <Badge variant="outline" className="border-gray-300 text-gray-700 dark:text-gray-300">
            {format(new Date(), "MMM d, yyyy")}
          </Badge>
        </div>
      </div>

      {/* Daily Overview */}
      <motion.div
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatCard
          title={t("Daily Collection")}
          value={`₹${dashboardData.overview.dailyCollection.toLocaleString()}`}
          description={t("Today's total income")}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          className="bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700"
        />
        <StatCard
          title={t("Daily Expenses")}
          value={`₹${dashboardData.overview.dailyExpenses.toLocaleString()}`}
          description={t("Today's total expenses")}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
        />
        <StatCard
          title={t("Daily Net")}
          value={`₹${dashboardData.overview.dailyNet.toLocaleString()}`}
          description={t("Today's net profit/loss")}
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          className={`${dashboardData.overview.dailyNet >= 0 
            ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700' 
            : 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700'}`}
        />
        <StatCard
          title={t("Pending Appointments")}
          value={dashboardData.overview.pendingAppointments}
          description={t("Appointments awaiting approval")}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          className="bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700"
        />
      </motion.div>

      {/* Weekly Overview */}
      <motion.div
        className="grid gap-4 grid-cols-1 md:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatCard
          title={t("Weekly Collection")}
          value={`₹${dashboardData.overview.weeklyCollection.toLocaleString()}`}
          description={t("This week's total income")}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700"
        />
        <StatCard
          title={t("Weekly Expenses")}
          value={`₹${dashboardData.overview.weeklyExpenses.toLocaleString()}`}
          description={t("This week's total expenses")}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
        />
        <StatCard
          title={t("Weekly Net")}
          value={`₹${dashboardData.overview.weeklyNet.toLocaleString()}`}
          description={t("This week's net profit/loss")}
          icon={<Activity className="h-5 w-5 text-indigo-600" />}
          className={`${dashboardData.overview.weeklyNet >= 0 
            ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700' 
            : 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700'}`}
        />
      </motion.div>

      {/* System Information */}
      <motion.div
        className="grid gap-4 grid-cols-1 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatCard
          title={t("Total Patients")}
          value={dashboardData.overview.totalPatients}
          description={t("Active patients in system")}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
        />
        <StatCard
          title={t("Total Doctors")}
          value={dashboardData.overview.totalDoctors}
          description={t("Active doctors in system")}
          icon={<Stethoscope className="h-5 w-5 text-purple-600" />}
          className="bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700"
        />
      </motion.div>

      {/* Daily Activities */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="appointments">{t("Today's Appointments")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("Quick Transactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("Today's Appointments")} ({dashboardData.appointments.today.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {dashboardData.appointments.today.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("No appointments scheduled for today")}</p>
                  </div>
                ) : (
                  dashboardData.appointments.today.map((appointment) => (
                    <motion.div
                      key={appointment._id}
                      className="flex items-center justify-between p-4 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ x: 5 }}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {appointment.patientName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.appointmentTime} • Dr. {appointment.doctor.name}
                        </p>
                      </div>
                      <Badge
                        variant={appointment.status === "Accepted" ? "default" : "secondary"}
                        className={
                          appointment.status === "Accepted"
                            ? "bg-green-600 hover:bg-green-700"
                            : appointment.status === "Pending"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : ""
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {t("Today's Income Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900 rounded-lg">
                    <span className="text-sm font-medium">{t("Total Income")}</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{dashboardData.transactions.todayIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <span className="text-sm font-medium">{t("Weekly Income")}</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₹{dashboardData.transactions.weeklyIncome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  {t("Today's Expense Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                    <span className="text-sm font-medium">{t("Total Expenses")}</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      ₹{dashboardData.transactions.todayExpenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
                    <span className="text-sm font-medium">{t("Weekly Expenses")}</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      ₹{dashboardData.transactions.weeklyExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Access Note */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t("Staff Access Level")}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t("You have access to daily operations, patient management, and basic financial data. For advanced analytics and user management, please contact your administrator.")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboard;