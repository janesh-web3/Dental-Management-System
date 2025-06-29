import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  User,
  FileText,
  Stethoscope,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  TrendingUpIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { crudRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecentTransactions } from "./RecentTransactions";
import { useTranslation } from "react-i18next";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { server } from "@/server";
import { Analytics } from "./Analytics";
import { motion } from "framer-motion";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
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
  type?: string;
  description?: string;
  uploadDate?: string;
  detectedType?: string;
}

interface RecentTreatment {
  patientName: string;
  treatment: string;
  date: string;
  status: string;
  treatmentAmount: number;
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

interface FinancialSummary {
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
  incomeByCategory: Array<{
    _id: string;
    total: number;
  }>;
  expenseByCategory: Array<{
    _id: string;
    total: number;
  }>;
  recentIncome: Array<any>;
  recentExpenses: Array<any>;
}

// Reusable StatCard component with animation
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  className: string;
}


const StatCard = ({
  title,
  value,
  description,
  icon,
  className,
}: StatCardProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        hover: {
          scale: 1.05,
          z: 20,
          transition: { duration: 0.3 },
        },
      }}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
        position: "relative",
        transformOrigin: "center center",
      }}
      className="group"
    >
      {/* Shadow card layer - sits at the bottom */}
      <div
        className={`absolute inset-0 rounded-lg bg-black/20 dark:bg-white/10 transition-all duration-300 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:blur-sm`}
        style={{ transform: "translateZ(-15px)" }}
      />

      {/* Background card layer */}
      <div
        className={`absolute inset-0 rounded-lg ${className} opacity-80 transition-all duration-300 group-hover:scale-95`}
        style={{ transform: "translateZ(-5px)" }}
      />

      {/* Main card layer */}
      <Card
        className={`relative shadow-lg transition-all ${className} h-[150px] z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90`}
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Highlight overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/20 to-transparent rounded-lg pointer-events-none group-hover:opacity-80 transition-opacity duration-300" />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative gap-2">
          <CardTitle className="text-sm font-medium relative z-10">
            {title}
          </CardTitle>
          <motion.div
            className="p-2 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-sm shadow-md"
            style={{ transformStyle: "preserve-3d" }}
            variants={{
              hover: {
                y: -10,
                x: 5,
                rotateY: 15,
                scale: 1.1,
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                transition: { duration: 0.4, delay: 0.1 },
              },
            }}
          >
            {icon}
          </motion.div>
        </CardHeader>

        <CardContent className="relative z-10">
          <motion.div
            className="text-2xl font-bold mb-1"
            variants={{
              hover: {
                y: -8,
                x: 5,
                scale: 1.05,
                transition: { duration: 0.3, delay: 0.05 },
              },
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {value}
          </motion.div>
          <motion.p
            className="text-[10px] text-gray-500 dark:text-gray-400"
            variants={{
              hover: {
                y: -5,
                transition: { duration: 0.3 },
              },
            }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {description}
          </motion.p>
        </CardContent>
      </Card>

      {/* Floating accent elements */}
      <motion.div
        className="absolute top-3 right-3 w-8 h-8 rounded-full opacity-60 bg-white dark:bg-white/10 z-20 shadow-md"
        style={{ transform: "translateZ(10px)" }}
        variants={{
          hover: {
            y: -15,
            x: -5,
            scale: 1.2,
            opacity: 0.8,
            transition: { duration: 0.4, delay: 0.2 },
          },
        }}
      />

      {/* Small decorative dot */}
      <motion.div
        className="absolute bottom-4 right-8 w-3 h-3 rounded-full opacity-70 bg-white dark:bg-white/20 z-20 hidden group-hover:block"
        style={{ transform: "translateZ(15px)" }}
        variants={{
          hover: {
            y: -10,
            x: 8,
            scale: 1.5,
            opacity: 0.6,
            transition: { duration: 0.5, delay: 0.3 },
          },
        }}
      />
    </motion.div>
  );
};


const Dashboard = () => {
  const { t } = useTranslation();

  const [isCustomDateRange, _setIsCustomDateRange] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<TreatmentDocument | null>(null);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);

  const [dateRange, _setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2020, 0, 1),
    to: new Date(),
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [revenueData, setRevenueData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, _setViewMode] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

  // Function to determine document icon and type
  const getDocumentDetails = (doc: TreatmentDocument) => {
    // Check if doc or doc.url is undefined
    if (!doc || !doc.url) {
      // Return a default icon and empty document
      return {
        icon: (
          <FileText className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
        ),
        enhancedDoc: { ...doc, detectedType: "unknown" },
      };
    }

    // Common file extensions
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
      ".dcm",
      ".dicom",
    ];
    const pdfExtensions = [".pdf"];
    const docExtensions = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
    const xrayExtensions = [".dcm", ".dicom"]; // DICOM is common for medical imaging

    const urlLower = doc.url.toLowerCase();

    // Check by extension
    const isImage = imageExtensions.some((ext) => urlLower.endsWith(ext));
    const isPdf = pdfExtensions.some((ext) => urlLower.endsWith(ext));
    const isDoc = docExtensions.some((ext) => urlLower.endsWith(ext));
    const isXray = xrayExtensions.some((ext) => urlLower.endsWith(ext));

    // Check by filename patterns typically used for dental X-rays
    const hasXrayInName =
      (doc.name || "").toLowerCase().includes("xray") ||
      (doc.name || "").toLowerCase().includes("x-ray") ||
      (doc.name || "").toLowerCase().includes("dental scan") ||
      (doc.name || "").toLowerCase().includes("radiograph");

    // Check by description patterns
    const hasXrayInDescription =
      (doc.description || "").toLowerCase().includes("xray") ||
      (doc.description || "").toLowerCase().includes("x-ray") ||
      (doc.description || "").toLowerCase().includes("dental scan") ||
      (doc.description || "").toLowerCase().includes("radiograph");

    // Check by type if available
    const typeBasedCheck = doc.type
      ? {
          isImage: doc.type.includes("image"),
          isPdf:
            doc.type.includes("pdf") || doc.type.includes("application/pdf"),
          isDoc:
            doc.type.includes("word") ||
            doc.type.includes("excel") ||
            doc.type.includes("powerpoint"),
          isXray:
            doc.type.includes("dicom") || doc.type.includes("image/dicom"),
        }
      : { isImage: false, isPdf: false, isDoc: false, isXray: false };

    // Combine checks
    const fileIsImage = isImage || typeBasedCheck.isImage;
    const fileIsPdf = isPdf || typeBasedCheck.isPdf;
    const fileIsDoc = isDoc || typeBasedCheck.isDoc;
    const fileIsXray =
      isXray || typeBasedCheck.isXray || hasXrayInName || hasXrayInDescription;

    // Return icon based on file type
    let icon;
    let type = "unknown";

    if (fileIsXray) {
      icon = (
        <ImageIcon className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
      );
      type = "xray";
    } else if (fileIsImage) {
      icon = (
        <ImageIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
      );
      type = "image";
    } else if (fileIsPdf) {
      icon = (
        <FileText className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
      );
      type = "pdf";
    } else if (fileIsDoc) {
      icon = (
        <FileText className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
      );
      type = "document";
    } else {
      icon = (
        <FileText className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
      );
      type = "unknown";
    }

    // Enhance document with detected type
    const enhancedDoc = {
      ...doc,
      detectedType: type,
    };

    return { icon, enhancedDoc };
  };

  const handleOpenDocument = (doc: TreatmentDocument) => {
    // Make sure we have a valid document before trying to open it
    if (!doc || !doc.url) {
      console.error(
        "Cannot open document: Invalid document or missing URL",
        doc
      );
      return;
    }

    const { enhancedDoc } = getDocumentDetails(doc);
    setSelectedDocument({
      ...enhancedDoc,
      // Ensure we have a name for display purposes
      name: enhancedDoc.name || "Document",
      type: enhancedDoc.detectedType, // Add the detected type
    });
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  const fetchFinancialSummary = async () => {
    try {
      const response = await crudRequest<{
        success: boolean;
        data: FinancialSummary;
      }>("GET", `${server}/finance/summary`);
      if (response.success) {
        setFinancialSummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Use the simplified endpoint temporarily for troubleshooting
        const response = (await crudRequest(
          "GET",
          `${server}/patient/simplified-dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&viewMode=${viewMode}`
        )) as { data: DashboardData };
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const response = (await crudRequest(
          "GET",
          `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&viewMode=${viewMode}`
        )) as { data: DashboardData };
        setRevenueData(response.data);
        console.log("Fetched revenue data:", response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchRevenueData();
    fetchFinancialSummary();
  }, [dateRange, viewMode]);

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
    <div className="space-y-1 p-2 md:space-y-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("Dashboard")}</h2>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        {isCustomDateRange ? (
          <p>
            {t("Showing data from")} {format(dateRange.from, "MMM d, yyyy")}{" "}
            {t("to")} {format(dateRange.to, "MMM d, yyyy")}
          </p>
        ) : (
          <p>{t("Showing all-time data")}</p>
        )}
      </div>

      <motion.div
        className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-6"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatCard
          title={t("Total Patients")}
          value={dashboardData?.totalPatients || 0}
          description={t("Active patients in the system")}
          icon={
            <Users className="h-4 w-4 md:h-8 md:w-8 text-blue-600 dark:text-blue-200" />
          }
          className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800"
        />
        <StatCard
          title={t("Total Doctors")}
          value={dashboardData?.totalDoctors || 0}
          description={t("Active doctors in the system")}
          icon={
            <Stethoscope className="h-4 w-4 md:h-8 md:w-8 text-green-600 dark:text-green-200" />
          }
          className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-800"
        />
        <StatCard
          title={t("Total Appointments")}
          value={dashboardData?.totalAppointments || 0}
          description={t("Appointments in selected period")}
          icon={
            <Calendar className="h-4 w-4 md:h-8 md:w-8 text-purple-600 dark:text-purple-200" />
          }
          className="bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-800"
        />
        <StatCard
          title={t("Total Income")}
          value={`रु${(revenueData?.financialAnalysis?.total || 0) + (financialSummary?.summary.income || 0)}`}
          description={t("Total income ")}
          icon={
            <TrendingUp className="h-4 w-4 md:h-8 md:w-8 text-emerald-200" />
          }
          className="bg-emerald-50 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-800"
        />
        <StatCard
          title={t("Total Expense")}
          value={`रु${financialSummary?.summary.expense.toLocaleString() || 0}`}
          description={t("Total expenses")}
          icon={
            <TrendingDown className="h-4 w-4 md:h-8 md:w-8 text-rose-200" />
          }
          className="bg-rose-50 dark:bg-rose-900 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-800"
        />
        <StatCard
          title={t("Net Balance")}
          value={`रु${((revenueData?.financialAnalysis?.total || 0) + (financialSummary?.summary.income || 0) - (financialSummary?.summary.expense || 0)).toLocaleString()}`}
          description={t("Total balance after expenses")}
          icon={
            <Wallet className="h-4 w-4 md:h-8 md:w-8 text-blue-200 dark:text-blue-400" />
          }
          className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800"
        />
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Overview")}
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Transactions")}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Analytics")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-2 md:space-y-4">
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-indigo-50 dark:bg-neutral-900 border-indigo-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-800 dark:text-indigo-300">
                  {t("Financial Overview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title={t("Daily Revenue")}
                    value={
                      revenueData?.financialAnalysis
                        ? `रु${revenueData.financialAnalysis.daily.toLocaleString()}`
                        : t("....")
                    }
                    description={t("Daily revenue")}
                    icon={
                      <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-emerald-200" />
                    }
                    className="bg-emerald-50 dark:bg-red-900 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800"
                  />
                  <StatCard
                    title={t("Weekly Revenue")}
                    value={
                      revenueData?.financialAnalysis
                        ? `रु${revenueData.financialAnalysis.weekly.toLocaleString()}`
                        : t("....")
                    }
                    description={t("Weekly revenue")}
                    icon={
                      <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-emerald-200" />
                    }
                    className="bg-emerald-50 dark:bg-lime-900 border-lime-200 dark:border-lime-800 hover:bg-lime-100 dark:hover:bg-lime-800"
                  />
                  <StatCard
                    title={t("Monthly Revenue")}
                    value={
                      revenueData?.financialAnalysis
                        ? `रु${revenueData.financialAnalysis.monthly.toLocaleString()}`
                        : t("....")
                    }
                    description={t("Monthly revenue")}
                    icon={
                      <TrendingUpIcon className="h-4 w-4 md:h-6 md:w-6 text-emerald-200" />
                    }
                    className="bg-fuchsia-50 dark:bg-fuchsia-900 border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-800"
                  />
                  <StatCard
                    title={t("Total Revenue")}
                    value={
                      revenueData?.financialAnalysis
                        ? `रु${revenueData.financialAnalysis.total.toLocaleString()}`
                        : t("....")
                    }
                    description={t("Total revenue")}
                    icon={
                      <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-emerald-200" />
                    }
                    className="bg-emerald-50 dark:bg-cyan-900 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-800"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 bg-gray-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 dark:text-gray-300">
                  {t("Recent Documents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map(
                    (treatment, index) => (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.5 },
                          },
                        }}
                        style={{
                          perspective: "1200px",
                          transformStyle: "preserve-3d",
                          position: "relative",
                          transformOrigin: "center center",
                        }}
                        className="group"
                      >
                        {/* Shadow card layer - sits at the bottom */}
                        <div
                          className={`absolute inset-0 rounded-lg bg-black/20 dark:bg-white/10 transition-all duration-300 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:blur-sm`}
                          style={{ transform: "translateZ(-15px)" }}
                        />

                        {/* Background card layer */}
                        <div
                          className={`absolute inset-0 rounded-lg opacity-80 transition-all duration-300 group-hover:scale-95`}
                          style={{ transform: "translateZ(-5px)" }}
                        />

                        <div
                          key={index}
                          className={`mb-2 p-4 rounded-lg shadow-sm ${
                            treatment.treatment === "General Documents"
                              ? "dark:bg-sky-900 border-sky-200 dark:border-sky-800  z-10 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80"
                              : "dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800  z-10 backdrop-blur-lg bg-opacity-80 dark:bg-opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {treatment.patientName}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-400">
                                {treatment.treatment}
                              </p>
                              {treatment.treatment === "General Documents" && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 bg-blue-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100"
                                >
                                  General Documents
                                </Badge>
                              )}
                            </div>
                            {treatment.treatment !== "General Documents" && (
                              <Badge
                                variant={
                                  treatment.status === "Completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  treatment.status === "Completed"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : ""
                                }
                              >
                                {treatment.status}
                              </Badge>
                            )}
                          </div>
                          {/* Floating accent elements */}
                          <motion.div
                            className="absolute top-3 right-3 w-8 h-8 rounded-full opacity-60 bg-white dark:bg-white/10 z-20 shadow-md"
                            style={{ transform: "translateZ(10px)" }}
                            variants={{
                              hover: {
                                y: -15,
                                x: -5,
                                scale: 1.2,
                                opacity: 0.8,
                                transition: { duration: 0.4, delay: 0.2 },
                              },
                            }}
                          />

                          {/* Small decorative dot */}
                          <motion.div
                            className="absolute bottom-4 right-8 w-3 h-3 rounded-full opacity-70 bg-white dark:bg-white/20 z-20 hidden group-hover:block"
                            style={{ transform: "translateZ(15px)" }}
                            variants={{
                              hover: {
                                y: -10,
                                x: 8,
                                scale: 1.5,
                                opacity: 0.6,
                                transition: { duration: 0.5, delay: 0.3 },
                              },
                            }}
                          />
                          {treatment.documents &&
                            treatment.documents.length > 0 && (
                              <div className="mt-2 flex flex-col space-y-2">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {treatment.treatment === "General Documents"
                                    ? t("Patient Documents")
                                    : t("Treatment Documents")}{" "}
                                  ({treatment.documents.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {treatment.documents
                                    .filter((doc) => doc && doc.url)
                                    .map((doc, docIndex) => (
                                      <div
                                        key={docIndex}
                                        className="group relative"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={`border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                            treatment.treatment ===
                                            "General Documents"
                                              ? "border-blue-300 dark:border-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleOpenDocument(doc)
                                          }
                                        >
                                          {getDocumentDetails(doc).icon}
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {doc.name
                                              ? doc.name.length > 20
                                                ? `${doc.name.substring(0, 20)}...`
                                                : doc.name
                                              : "Unnamed document"}
                                          </span>
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </motion.div>
                    )
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle className="text-cyan-800 dark:text-cyan-300">
                  {t("Today's Appointments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.today.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="mb-4 flex items-center justify-between p-3 bg-white dark:bg-cyan-900 rounded-lg shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-cyan-900 dark:text-cyan-50">
                          {appointment.patientName}
                        </p>
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                          {appointment.time}
                        </p>
                      </div>
                      <Badge
                        variant={
                          appointment.status === "Completed"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          appointment.status === "Completed"
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-all bg-dashboard-treatments-light dark:bg-dashboard-treatments-dark border-dashboard-treatments-light/50 dark:border-dashboard-treatments-dark/50">
              <CardHeader>
                <CardTitle className="text-dashboard-treatments-dark/70 dark:text-dashboard-treatments-light/90">
                  {t("Recent Treatments & Documents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map(
                    (treatment, index) => (
                      <div
                        key={index}
                        className="mb-4 p-3 rounded-lg shadow-sm dark:bg-[hsl(12,50%,10%)]"
                        style={{
                          backgroundColor:
                            treatment.treatment === "General Documents"
                              ? "#EBF5FF"
                              : "white",
                          color: "hsl(12, 50%, 30%)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className="font-medium dark:text-[hsl(12,80%,80%)]"
                              style={{ color: "hsl(12, 50%, 25%)" }}
                            >
                              {treatment.patientName}
                            </p>
                            <p
                              className="text-sm dark:text-[hsl(12,70%,70%)]"
                              style={{ color: "hsl(12, 40%, 40%)" }}
                            >
                              {treatment.treatment}
                            </p>
                            {treatment.treatment === "General Documents" && (
                              <Badge
                                variant="outline"
                                className="mt-1"
                                style={{
                                  backgroundColor: "#DBEAFE",
                                  color: "#1E40AF",
                                  borderColor: "#93C5FD",
                                }}
                              >
                                General Documents
                              </Badge>
                            )}
                            <p
                              className="text-sm dark:text-[hsl(12,70%,70%)]"
                              style={{ color: "hsl(12, 40%, 40%)" }}
                            >
                              {treatment.date}
                            </p>
                          </div>
                          <div className="text-right">
                            {treatment.treatmentAmount > 0 && (
                              <p
                                className="font-medium dark:text-[hsl(12,80%,80%)]"
                                style={{ color: "hsl(12, 50%, 25%)" }}
                              >
                                रु{treatment.treatmentAmount}
                              </p>
                            )}
                            {treatment.treatment !== "General Documents" && (
                              <Badge
                                variant={
                                  treatment.status === "Completed"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  treatment.status === "Completed"
                                    ? "bg-green-500 hover:bg-green-600"
                                    : ""
                                }
                              >
                                {treatment.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {treatment.documents &&
                          treatment.documents.length > 0 && (
                            <div className="mt-2 flex flex-col space-y-2">
                              <p
                                className="text-xs font-medium dark:text-[hsl(12,70%,70%)]"
                                style={{ color: "hsl(12, 40%, 40%)" }}
                              >
                                {treatment.treatment === "General Documents"
                                  ? t("Patient Documents")
                                  : t("Treatment Documents")}{" "}
                                ({treatment.documents.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {treatment.documents
                                  .filter((doc) => doc && doc.url)
                                  .map((doc, docIndex) => (
                                    <div
                                      key={docIndex}
                                      className="group relative"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-amber-100 dark:hover:bg-[hsl(12,40%,15%)] dark:border-[hsl(12,40%,30%)] dark:text-[hsl(12,70%,70%)]"
                                        style={{
                                          borderColor:
                                            treatment.treatment ===
                                            "General Documents"
                                              ? "#93C5FD"
                                              : "hsl(12, 30%, 80%)",
                                          color:
                                            treatment.treatment ===
                                            "General Documents"
                                              ? "#1E40AF"
                                              : "hsl(12, 50%, 40%)",
                                          backgroundColor:
                                            treatment.treatment ===
                                            "General Documents"
                                              ? "rgba(219, 234, 254, 0.3)"
                                              : "transparent",
                                        }}
                                        onClick={() => handleOpenDocument(doc)}
                                      >
                                        {getDocumentDetails(doc).icon}
                                        <span>
                                          {doc.name
                                            ? doc.name.length > 20
                                              ? `${doc.name.substring(0, 20)}...`
                                              : doc.name
                                            : "Unnamed document"}
                                        </span>
                                      </Button>
                                      {doc.description && (
                                        <div
                                          className="absolute z-10 invisible group-hover:visible bg-white shadow-lg rounded-md p-2 mt-1 text-xs max-w-[200px] top-full left-0 dark:bg-[hsl(12,50%,10%)]"
                                          style={{ backgroundColor: "white" }}
                                        >
                                          <p
                                            className="font-semibold mb-1 dark:text-[hsl(12,80%,80%)]"
                                            style={{
                                              color: "hsl(12, 50%, 30%)",
                                            }}
                                          >
                                            {doc.name}
                                          </p>
                                          <p
                                            className="dark:text-[hsl(12,70%,70%)]"
                                            style={{
                                              color: "hsl(12, 40%, 40%)",
                                            }}
                                          >
                                            {doc.description}
                                          </p>
                                          {doc.uploadDate && (
                                            <p
                                              className="mt-1 dark:text-[hsl(12,60%,60%)]"
                                              style={{
                                                color: "hsl(12, 30%, 60%)",
                                              }}
                                            >
                                              {t("Uploaded")}:{" "}
                                              {format(
                                                new Date(doc.uploadDate),
                                                "MMM d, yyyy"
                                              )}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="transactions"
          className="space-y-4 transition-all duration-200"
        >
          <RecentTransactions />
        </TabsContent>

        <TabsContent
          value="analytics"
          className="space-y-4 transition-all duration-200"
        >
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all rounded-lg p-0.5">
            <Analytics />
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          document={selectedDocument}
        />
      )}
    </div>
  );
};

export default Dashboard;
