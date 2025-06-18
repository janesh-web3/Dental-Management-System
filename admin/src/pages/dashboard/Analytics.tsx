import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Users, DollarSign, UserCheck } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { crudRequest } from "@/lib/api";
import { CSVLink } from "react-csv";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import AppointmentAnalytics from "./analytics/AppointmentAnalytics.tsx";
import RevenueAnalytics from "./analytics/RevenueAnalytics.tsx";
import DoctorPerformance from "./analytics/DoctorPerformance.tsx";
import PatientInsights from "./analytics/PatientInsights.tsx";
import { useAdminContext } from "@/contexts/adminContext";

// Colors for charts
export const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#83a6ed",
  "#8884d8",
];

export function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const { adminDetails } = useAdminContext();
  // Check if user is admin
  useEffect(() => {
    if (adminDetails?.role !== "admin" && adminDetails?.role !== "superadmin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to view this page.",
      });
      // Redirect to dashboard or another appropriate page
      window.location.href = "/dashboard";
    }
  }, [adminDetails]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Generate CSV data based on active tab
    generateCSVData(value);
  };

  const generateCSVData = async (tab: string) => {
    try {
      setIsLoading(true);

      let endpoint = "";
      switch (tab) {
        case "appointments":
          endpoint = "/analytics/appointments";
          break;
        case "revenue":
          endpoint = "/analytics/revenue";
          break;
        case "doctors":
          endpoint = "/analytics/doctors";
          break;
        case "patients":
          endpoint = "/analytics/patients";
          break;
        default:
          endpoint = "/analytics/appointments";
      }

      const from = dateRange.from?.toISOString();
      const to = dateRange.to?.toISOString();

      const response: any = await crudRequest(
        "GET",
        `${endpoint}?startDate=${from}&endDate=${to}&period=${period}`
      );

      if (response.success && response.data) {
        // Format data for CSV export based on tab
        let formattedData: any[] = [];

        switch (tab) {
          case "appointments":
            formattedData = formatAppointmentDataForCSV(response.data);
            break;
          case "revenue":
            formattedData = formatRevenueDataForCSV(response.data);
            break;
          case "doctors":
            formattedData = formatDoctorDataForCSV(response.data);
            break;
          case "patients":
            formattedData = formatPatientDataForCSV(response.data);
            break;
        }

        setCsvData(formattedData);
      }
    } catch (error) {
      console.error("Error generating CSV data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate export data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions to format data for CSV export
  const formatAppointmentDataForCSV = (data: any) => {
    const { appointmentsByStatus, genderDistribution, doctorAppointments } =
      data;

    // Format status data
    const statusData = appointmentsByStatus.map((item: any) => ({
      Category: "Status",
      Type: item._id,
      Count: item.count,
    }));

    // Format gender data
    const genderData = genderDistribution.map((item: any) => ({
      Category: "Gender",
      Type: item._id,
      Count: item.count,
    }));

    // Format doctor data
    const doctorData = doctorAppointments.map((item: any) => ({
      Category: "Doctor",
      Type: item.doctorName || "Unknown",
      Count: item.count,
    }));

    return [...statusData, ...genderData, ...doctorData];
  };

  const formatRevenueDataForCSV = (data: any) => {
    const { revenueData, doctorRevenue, topPayingPatients } = data;

    // Format revenue over time
    const timeData = revenueData.map((item: any) => ({
      Category: "Revenue Over Time",
      Date: item.date,
      TotalAmount: item.totalAmount,
      PaidAmount: item.paidAmount,
      RemainingAmount: item.remainingAmount,
    }));

    // Format doctor revenue
    const doctorData = doctorRevenue.map((item: any) => ({
      Category: "Doctor Revenue",
      Doctor: item.doctorName,
      TotalAmount: item.totalAmount,
      PaidAmount: item.paidAmount,
      RemainingAmount: item.remainingAmount,
    }));

    // Format top patients
    const patientData = topPayingPatients.map((item: any) => ({
      Category: "Top Patients",
      Patient: item.patientName,
      TotalAmount: item.totalAmount,
      PaidAmount: item.totalPaid,
      RemainingAmount: item.remainingAmount,
    }));

    return [...timeData, ...doctorData, ...patientData];
  };

  const formatDoctorDataForCSV = (data: any) => {
    const { patientsPerDoctor, doctorRatings, doctorActivity } = data;

    // Format patients per doctor
    const patientData = patientsPerDoctor.map((item: any) => ({
      Category: "Patients Per Doctor",
      Doctor: item.doctorName,
      PatientCount: item.patientCount,
    }));

    // Format doctor ratings
    const ratingData = doctorRatings.map((item: any) => ({
      Category: "Doctor Ratings",
      Doctor: item.doctorName,
      ReviewCount: item.reviewCount,
      AverageRating: item.averageRating,
    }));

    // Format doctor activity
    const activityData = doctorActivity.map((item: any) => ({
      Category: "Doctor Activity",
      Doctor: item.doctorName,
      AppointmentCount: item.appointmentCount,
      CompletedCount: item.completedCount,
      CancelledCount: item.cancelledCount,
      CompletionRate: item.completionRate.toFixed(2) + "%",
    }));

    return [...patientData, ...ratingData, ...activityData];
  };

  const formatPatientDataForCSV = (data: any) => {
    const { patientTypeData, followUpData } = data;

    // Format patient type data
    const typeData = patientTypeData.map((item: any) => ({
      Category: "Patient Types",
      Date: item.date,
      NewPatients: item.newPatients,
      ReturningPatients: item.returningPatients,
    }));

    // Format follow-up data
    const followUpDetails = followUpData.details.map((item: any) => ({
      Category: "Follow-ups",
      Patient: item.patientName,
      ContactNumber: item.contactNumber,
      FollowUpDate: format(new Date(item.followUpDate), "yyyy-MM-dd"),
      Status: item.isOverdue ? "Overdue" : "Upcoming",
    }));

    return [...typeData, ...followUpDetails];
  };

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
        <CardTitle className="text-xl sm:text-2xl font-bold">
          Advanced Analytics & Reporting
        </CardTitle>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-2">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Select
            value={period}
            onValueChange={(value: "daily" | "weekly" | "monthly") =>
              setPeriod(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          {isLoading ? (
            <Button disabled className="cursor-not-allowed w-full sm:w-auto">
              <span className="animate-spin mr-2">⏳</span>
              Loading...
            </Button>
          ) : (
            csvData.length > 0 && (
              <CSVLink
                data={csvData}
                filename={`dental-analytics-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </CSVLink>
            )
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-10 md:space-x-4"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="revenue" className="flex items-center text-xs sm:text-sm">
              <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center text-xs sm:text-sm">
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center text-xs sm:text-sm">
              <UserCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center text-xs sm:text-sm">
              <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Patients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4 overflow-x-auto">
            <RevenueAnalytics dateRange={dateRange} period={period} />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4 overflow-x-auto">
            <AppointmentAnalytics dateRange={dateRange} period={period} />
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4 overflow-x-auto">
            <DoctorPerformance dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="patients" className="space-y-4 overflow-x-auto">
            <PatientInsights dateRange={dateRange} period={period} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
