import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";
import { CSVLink } from "react-csv";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface FinancialSummaryData {
  summary: {
    income: number;
    expense: number;
    balance: number;
    servicePayment: number;
  };
  incomeByCategory: Array<{
    _id: string;
    total: number;
  }>;
  expenseByCategory: Array<{
    _id: string;
    total: number;
  }>;
  serviceByType: Array<{
    _id: string;
    total: number;
  }>;
  recentIncome: any[];
  recentExpenses: any[];
  recentServicePayments: any[];
}

interface FinancialData {
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
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export function FinancialInsights() {
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2020, 0, 1), // Start from January 1, 2020 for all-time data
    to: new Date(),
  });
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [rawFinancialData, setRawFinancialData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

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
      from: new Date(2020, 0, 1), // Reset to January 1, 2020 for all-time data
      to: new Date()
    });
    setIsCustomDateRange(false);
  };

  const calculateDailyRevenue = (data: FinancialSummaryData) => {
    const today = new Date();
    const servicePayments = Array.isArray(data.recentServicePayments) ? data.recentServicePayments : [];
    const incomeRecords = Array.isArray(data.recentIncome) ? data.recentIncome : [];
    
    const todayRecords = [...servicePayments, ...incomeRecords].filter(
      record => {
        if (!record) return false;
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate.toDateString() === today.toDateString();
      }
    );
    return todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
  };

  const calculateWeeklyRevenue = (data: FinancialSummaryData) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const servicePayments = Array.isArray(data.recentServicePayments) ? data.recentServicePayments : [];
    const incomeRecords = Array.isArray(data.recentIncome) ? data.recentIncome : [];
    
    const weekRecords = [...servicePayments, ...incomeRecords].filter(
      record => {
        if (!record) return false;
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate >= oneWeekAgo;
      }
    );
    return weekRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
  };

  const calculateMonthlyRevenue = (data: FinancialSummaryData) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const servicePayments = Array.isArray(data.recentServicePayments) ? data.recentServicePayments : [];
    const incomeRecords = Array.isArray(data.recentIncome) ? data.recentIncome : [];
    
    const monthRecords = [...servicePayments, ...incomeRecords].filter(
      record => {
        if (!record) return false;
        const recordDate = new Date(record.date || record.createdAt);
        return recordDate >= oneMonthAgo;
      }
    );
    return monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
  };

  const generateRevenueTrend = (data: FinancialSummaryData) => {
    const servicePayments = Array.isArray(data.recentServicePayments) ? data.recentServicePayments : [];
    const incomeRecords = Array.isArray(data.recentIncome) ? data.recentIncome : [];
    const allRecords = [...servicePayments, ...incomeRecords];
    const trendMap = new Map<string, number>();
    
    allRecords.forEach(record => {
      if (!record) return;
      const date = new Date(record.date || record.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + (record.amount || 0));
    });
    
    return Array.from(trendMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
  };

  const processFinancialData = (summaryData: FinancialSummaryData): FinancialData => {
    const summary = summaryData.summary || { income: 0, expense: 0, balance: 0, servicePayment: 0 };
    const serviceByType = Array.isArray(summaryData.serviceByType) ? summaryData.serviceByType : [];
    
    return {
      daily: calculateDailyRevenue(summaryData),
      weekly: calculateWeeklyRevenue(summaryData),
      monthly: calculateMonthlyRevenue(summaryData),
      total: summary.income + summary.servicePayment,
      revenueByDoctor: [],
      revenueByTreatment: serviceByType.map(item => ({
        treatmentType: item._id || 'Unknown',
        revenue: item.total || 0
      })),
      revenueTrend: generateRevenueTrend(summaryData),
      paymentMethods: []
    };
  };

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        
        const fetchWithErrorHandling = async (url: string, name: string) => {
          try {
            return await crudRequest("GET", url);
          } catch (error) {
            console.warn(`Failed to fetch ${name}:`, error);
            return { data: { summary: { income: 0, expense: 0, balance: 0, servicePayment: 0 }, incomeByCategory: [], expenseByCategory: [], serviceByType: [], recentIncome: [], recentExpenses: [], recentServicePayments: [] } };
          }
        };
        
        // Fetch financial summary with date filters
        const summaryUrl = `${server}/finance/summary?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
        const [summaryResponse, servicePaymentsResponse, appointmentsResponse] = await Promise.all([
          fetchWithErrorHandling(summaryUrl, 'financial summary'),
          fetchWithErrorHandling(`${server}/service-payment`, 'service payments'),
          fetchWithErrorHandling(`${server}/appointment/get-appointments`, 'appointments')
        ]);
        
        const summaryData = (summaryResponse as { data: FinancialSummaryData }).data;
        setRawFinancialData(summaryData);
        
        // Process payment methods from service payments with null checks
        const servicePayments = Array.isArray((servicePaymentsResponse as { data: any }).data) ? (servicePaymentsResponse as { data: any }).data as any[] : [];
        const paymentMethodsMap = new Map<string, number>();
        
        servicePayments.forEach(payment => {
          if (payment && payment.paymentMethod && payment.amount) {
            const method = payment.paymentMethod;
            paymentMethodsMap.set(method, (paymentMethodsMap.get(method) || 0) + payment.amount);
          }
        });
        
        // Process doctor revenue from appointments and service payments with null checks
        const appointments = Array.isArray((appointmentsResponse as { data: any }).data) ? (appointmentsResponse as { data: any }).data as any[] : [];
        const doctorRevenueMap = new Map<string, number>();
        
        // Calculate revenue by doctor from appointments with fees
        appointments.forEach(appointment => {
          if (appointment && appointment.doctorName && appointment.fee) {
            const doctorName = appointment.doctorName;
            doctorRevenueMap.set(doctorName, (doctorRevenueMap.get(doctorName) || 0) + appointment.fee);
          }
        });
        
        // Also include service payments that have doctor information
        servicePayments.forEach(payment => {
          if (payment && payment.doctor && payment.amount) {
            const doctorName = payment.doctor.name || payment.doctorName;
            if (doctorName) {
              doctorRevenueMap.set(doctorName, (doctorRevenueMap.get(doctorName) || 0) + payment.amount);
            }
          }
        });
        
        const processedData = processFinancialData(summaryData);
        processedData.paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, amount]) => ({
          method,
          amount
        }));
        processedData.revenueByDoctor = Array.from(doctorRevenueMap.entries()).map(([doctorName, revenue]) => ({
          doctorName,
          revenue
        }));
        
        setFinancialData(processedData);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [dateRange, viewMode]);

  const getPaymentMethods = () => {
    return financialData?.paymentMethods || [];
  };

  const handleExportCSV = () => {
    if (!financialData) return [];
    
    // Prepare data for CSV export based on current tab
    const csvData = financialData.revenueTrend.map((item) => ({
      Date: format(new Date(item.date), "yyyy-MM-dd"),
      Revenue: item.revenue,
    }));
    
    return csvData;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Financial Insights</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          {isCustomDateRange && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetDateRange}
            >
              All Time Data
            </Button>
          )}
          <CSVLink
            data={handleExportCSV()}
            filename={`financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`}
          >
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CSVLink>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          {isCustomDateRange ? (
            <p>
              Showing data from {format(dateRange.from, "MMM d, yyyy")} to {format(dateRange.to, "MMM d, yyyy")}
            </p>
          ) : (
            <p>Showing all-time data</p>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                रु {financialData?.daily.toLocaleString("en-IN") || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialData?.daily && financialData?.weekly ? (
                  financialData.daily > financialData.weekly / 7 ? (
                    <span className="text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Above average
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Below average
                    </span>
                  )
                ) : null}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                रु {financialData?.weekly.toLocaleString("en-IN") || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialData?.weekly && financialData?.monthly ? (
                  financialData.weekly > financialData.monthly / 4 ? (
                    <span className="text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Above average
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Below average
                    </span>
                  )
                ) : null}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                रु {financialData?.monthly.toLocaleString("en-IN") || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialData?.monthly && financialData?.total ? (
                  financialData.monthly > financialData.total / 12 ? (
                    <span className="text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Above average
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Below average
                    </span>
                  )
                ) : null}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                रु {financialData?.total.toLocaleString("en-IN") || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue-trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue-trend">Revenue Trend</TabsTrigger>
            <TabsTrigger value="revenue-by-doctor">Revenue by Doctor</TabsTrigger>
            <TabsTrigger value="revenue-by-treatment">Revenue by Treatment</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue-trend" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={financialData?.revenueTrend || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`रु ${value.toLocaleString("en-IN")}`, "Revenue"]}
                    labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="revenue-by-doctor" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialData?.revenueByDoctor || []}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctorName" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`रु ${value.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="revenue-by-treatment" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialData?.revenueByTreatment || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="revenue"
                    nameKey="treatmentType"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {financialData?.revenueByTreatment?.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`रु ${value.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPaymentMethods()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="method"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {getPaymentMethods().map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`रु ${value.toLocaleString("en-IN")}`, "Amount"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 