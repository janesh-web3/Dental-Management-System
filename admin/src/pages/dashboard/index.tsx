import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  IndianRupee,
  User,
  FileText,
  Stethoscope,
  Image as ImageIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecentTransactions } from "./RecentTransactions";
import { useTranslation } from "react-i18next";
import { DocumentViewer } from "@/components/ui/document-viewer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DateRange } from "react-day-picker";
import { server } from "@/server";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Analytics } from "./Analytics";

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

const Dashboard = () => {
  const { t } = useTranslation();

  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<TreatmentDocument | null>(null);

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2020, 0, 1),
    to: new Date(),
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "daily"
  );

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
      setIsCustomDateRange(true);
    }
  };

  const handleResetDateRange = () => {
    setDateRange({
      from: new Date(2020, 0, 1),
      to: new Date(),
    });
    setIsCustomDateRange(false);
  };

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = (await crudRequest(
          "GET",
          `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&viewMode=${viewMode}`
        )) as { data: DashboardData };
        setDashboardData(response.data);
        console.log("Dashboard data set:", response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("Dashboard")}</h2>
        <div className="flex items-center gap-4">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          {isCustomDateRange && (
            <Button variant="outline" onClick={handleResetDateRange} size="sm">
              {t("All Time Data")}
            </Button>
          )}
          <Select
            value={viewMode}
            onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") =>
              setViewMode(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("Daily")}</SelectItem>
              <SelectItem value="weekly">{t("Weekly")}</SelectItem>
              <SelectItem value="monthly">{t("Monthly")}</SelectItem>
              <SelectItem value="yearly">{t("Yearly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all hover:bg-blue-100 dark:hover:bg-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {t("Total Patients")}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-50">
              {dashboardData?.totalPatients}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {t("Active patients in the system")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all hover:bg-green-100 dark:hover:bg-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">
              {t("Total Doctors")}
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-50">
              {dashboardData?.totalDoctors}
            </div>
            <p className="text-xs text-green-700 dark:text-green-400">
              {t("Active doctors in the system")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-all hover:bg-purple-100 dark:hover:bg-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-300">
              {t("Total Appointments")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-50">
              {dashboardData?.totalAppointments}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              {t("Appointments in selected period")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800 shadow-sm hover:shadow-md transition-all hover:bg-teal-100 dark:hover:bg-teal-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800 dark:text-teal-300">
              {t("Total Revenue")}
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-50">
              ₹{dashboardData?.financialAnalysis.total.toLocaleString()}
            </div>
            <p className="text-xs text-teal-700 dark:text-teal-400">
              {t("Total revenue in selected period")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Overview")}
          </TabsTrigger>
          {/* <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Analytics")}
          </TabsTrigger> */}
          {/* <TabsTrigger
            value="appointments"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Appointments")}
          </TabsTrigger> */}
          <TabsTrigger
            value="doctors"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950"
          >
            {t("Doctors")}
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

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-800 dark:text-indigo-300">
                  {t("Financial Overview")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white dark:bg-indigo-900 p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      {t("Daily Revenue")}
                    </p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                      ₹{dashboardData?.financialAnalysis.daily.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-indigo-900 p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      {t("Weekly Revenue")}
                    </p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                      ₹
                      {dashboardData?.financialAnalysis.weekly.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-indigo-900 p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      {t("Monthly Revenue")}
                    </p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                      ₹
                      {dashboardData?.financialAnalysis.monthly.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-indigo-900 p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      {t("Total Revenue")}
                    </p>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-50">
                      ₹{dashboardData?.financialAnalysis.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-[300px] bg-white dark:bg-indigo-900 p-3 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dashboardData?.financialAnalysis.revenueTrend}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#cdd7e7" />
                      <XAxis dataKey="date" stroke="#6366f1" />
                      <YAxis stroke="#6366f1" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#eef2ff",
                          borderColor: "#a5b4fc",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ fill: "#4f46e5", r: 4 }}
                        activeDot={{ r: 6, fill: "#4338ca" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-800 dark:text-gray-300">
                  {t("Recent Treatment Documents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map(
                    (treatment, index) => (
                      <div
                        key={index}
                        className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {treatment.patientName}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                              {treatment.treatment}
                            </p>
                          </div>
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
                        </div>
                        {treatment.documents &&
                          treatment.documents.length > 0 && (
                            <div className="mt-2 flex flex-col space-y-2">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {t("Treatment Documents")} (
                                {treatment.documents.length})
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
                                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => handleOpenDocument(doc)}
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
                                      {doc.description && (
                                        <div className="absolute z-10 invisible group-hover:visible bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 mt-1 text-xs max-w-[200px] top-full left-0">
                                          <p className="font-semibold mb-1">
                                            {doc.name}
                                          </p>
                                          <p className="text-gray-600 dark:text-gray-400">
                                            {doc.description}
                                          </p>
                                          {doc.uploadDate && (
                                            <p className="text-gray-500 dark:text-gray-500 mt-1">
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

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 shadow-sm hover:shadow-md transition-all">
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
                  {t("Recent Treatments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {dashboardData?.analytics.recentTreatments.map(
                    (treatment, index) => (
                      <div
                        key={index}
                        className="mb-4 p-3 rounded-lg shadow-sm dark:bg-[hsl(12,50%,10%)]"
                        style={{ backgroundColor: 'white', color: 'hsl(12, 50%, 30%)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium dark:text-[hsl(12,80%,80%)]" style={{ color: 'hsl(12, 50%, 25%)' }}>
                              {treatment.patientName}
                            </p>
                            <p className="text-sm dark:text-[hsl(12,70%,70%)]" style={{ color: 'hsl(12, 40%, 40%)' }}>
                              {treatment.treatment}
                            </p>
                            <p className="text-sm dark:text-[hsl(12,70%,70%)]" style={{ color: 'hsl(12, 40%, 40%)' }}>
                              {treatment.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium dark:text-[hsl(12,80%,80%)]" style={{ color: 'hsl(12, 50%, 25%)' }}>
                              ₹{treatment.amount}
                            </p>
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
                          </div>
                        </div>
                        {treatment.documents &&
                          treatment.documents.length > 0 && (
                            <div className="mt-2 flex flex-col space-y-2">
                              <p className="text-xs font-medium dark:text-[hsl(12,70%,70%)]" style={{ color: 'hsl(12, 40%, 40%)' }}>
                                {t("Treatment Documents")} (
                                {treatment.documents.length})
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
                                        style={{ borderColor: 'hsl(12, 30%, 80%)', color: 'hsl(12, 50%, 40%)' }}
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
                                        <div className="absolute z-10 invisible group-hover:visible bg-white shadow-lg rounded-md p-2 mt-1 text-xs max-w-[200px] top-full left-0 dark:bg-[hsl(12,50%,10%)]" style={{ backgroundColor: 'white' }}>
                                          <p className="font-semibold mb-1 dark:text-[hsl(12,80%,80%)]" style={{ color: 'hsl(12, 50%, 30%)' }}>
                                            {doc.name}
                                          </p>
                                          <p className="dark:text-[hsl(12,70%,70%)]" style={{ color: 'hsl(12, 40%, 40%)' }}>
                                            {doc.description}
                                          </p>
                                          {doc.uploadDate && (
                                            <p className="mt-1 dark:text-[hsl(12,60%,60%)]" style={{ color: 'hsl(12, 30%, 60%)' }}>
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

        <TabsContent value="doctors" className="space-y-4">
          <Card className="bg-lime-50 dark:bg-lime-950 border-lime-200 dark:border-lime-800 shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="text-lime-800 dark:text-lime-300">
                {t("Doctor Progress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!dashboardData?.doctorPerformance ||
              dashboardData.doctorPerformance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg text-lime-700 dark:text-lime-400">
                    No doctor data available
                  </p>
                  <p className="text-sm text-lime-600 dark:text-lime-500 mt-2">
                    Create doctors in the system to view progress data
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dashboardData.doctorPerformance.map((doctor) => (
                    <Card
                      key={doctor._id}
                      className="bg-white dark:bg-lime-900 border-lime-100 dark:border-lime-700"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-lime-900 dark:text-lime-100">
                              {doctor.doctorName}
                            </CardTitle>
                            <p className="text-sm text-lime-700 dark:text-lime-300">
                              {doctor.specialization}
                            </p>
                          </div>
                          <Avatar className="bg-lime-100 dark:bg-lime-800">
                            <User className="h-6 w-6 text-lime-600 dark:text-lime-300" />
                          </Avatar>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-lime-700 dark:text-lime-300">
                              {t("Patients Treated")}
                            </p>
                            <p className="text-2xl font-bold text-lime-900 dark:text-lime-50">
                              {doctor.patientsCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-lime-700 dark:text-lime-300">
                              {t("Treatments Completed")}
                            </p>
                            <p className="text-2xl font-bold text-lime-900 dark:text-lime-50">
                              {doctor.treatmentsCompleted}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-lime-700 dark:text-lime-300">
                              {t("Performance Rate")}
                            </p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={doctor.performanceRate}
                                className="h-2 bg-lime-200 dark:bg-lime-800"
                              />
                              <span className="text-sm font-medium text-lime-900 dark:text-lime-50">
                                {doctor.performanceRate}%
                              </span>
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
