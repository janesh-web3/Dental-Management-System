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
  yearly: number;
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
  const [, setRawFinancialData] = useState<FinancialSummaryData | null>(null);
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

  // Process financial data from dashboard metrics (includes all revenue sources)
  const processFinancialData = (dashboardData: any): FinancialData => {
    const financialAnalysis = dashboardData.financialAnalysis || {};
    
    return {
      daily: financialAnalysis.daily || 0,
      weekly: financialAnalysis.weekly || 0,
      monthly: financialAnalysis.monthly || 0,
      yearly: financialAnalysis.yearly || 0,
      total: financialAnalysis.total || 0,
      revenueByDoctor: financialAnalysis.revenueByDoctor || [],
      revenueByTreatment: financialAnalysis.revenueByTreatment || [],
      revenueTrend: financialAnalysis.revenueTrend || [],
      paymentMethods: []
    };
  };

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard metrics which includes all revenue sources (service payments, selected teeth, group treatments)
        const dashboardUrl = `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&viewMode=${viewMode}`;
        const dashboardResponse = await crudRequest("GET", dashboardUrl);
        const dashboardData = dashboardResponse.data;
        
        // Get service payments for payment method analysis
        const servicePaymentsResponse = await crudRequest("GET", `${server}/service-payment`);
        const servicePayments = Array.isArray(servicePaymentsResponse.data) ? servicePaymentsResponse.data : [];
        
        // Process payment methods from service payments with date filtering
        const paymentMethodsMap = new Map<string, number>();
        const filteredServicePayments = servicePayments.filter(payment => {
          if (!payment || !payment.date) return false;
          const paymentDate = new Date(payment.date);
          return paymentDate >= dateRange.from && paymentDate <= dateRange.to;
        });
        
        filteredServicePayments.forEach(payment => {
          if (payment && payment.paymentMethod && payment.amount) {
            const method = payment.paymentMethod;
            paymentMethodsMap.set(method, (paymentMethodsMap.get(method) || 0) + payment.amount);
          }
        });
        
        const processedData = processFinancialData(dashboardData);
        processedData.paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, amount]) => ({
          method,
          amount
        }));
        
        setFinancialData(processedData);
        
        // Also set raw data for backward compatibility (though we're not using the old endpoint anymore)
        setRawFinancialData({
          summary: { 
            income: processedData.total, 
            expense: 0, 
            balance: processedData.total, 
            servicePayment: 0 
          },
          incomeByCategory: [],
          expenseByCategory: [],
          serviceByType: processedData.revenueByTreatment.map(item => ({
            _id: item.treatmentType,
            total: item.revenue
          })),
          recentIncome: [],
          recentExpenses: [],
          recentServicePayments: filteredServicePayments
        });
        
      } catch (error) {
        console.error("Error fetching financial data:", error);
        // Set default data on error
        setFinancialData({
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
          total: 0,
          revenueByDoctor: [],
          revenueByTreatment: [],
          revenueTrend: [],
          paymentMethods: []
        });
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
    
    // Prepare comprehensive financial data for CSV export
    const csvData = [
      {
        Metric: "Daily Revenue",
        Amount: financialData.daily,
        Period: "Today"
      },
      {
        Metric: "Weekly Revenue", 
        Amount: financialData.weekly,
        Period: "Last 7 days"
      },
      {
        Metric: "Monthly Revenue",
        Amount: financialData.monthly,
        Period: "Last 30 days"
      },
      {
        Metric: "Yearly Revenue",
        Amount: financialData.yearly,
        Period: "Annual"
      },
      {
        Metric: "Total Revenue",
        Amount: financialData.total,
        Period: `${format(dateRange.from, "yyyy-MM-dd")} to ${format(dateRange.to, "yyyy-MM-dd")}`
      }
    ];
    
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
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
              <CardTitle className="text-sm font-medium">Yearly Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                रु {financialData?.yearly.toLocaleString("en-IN") || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Annual projection
                </span>
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