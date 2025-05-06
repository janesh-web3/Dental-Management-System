import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  DollarSign, 
  CreditCard, 
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
      from: new Date(2020, 0, 1), // Reset to January 1, 2020 for all-time data
      to: new Date()
    });
    setIsCustomDateRange(false);
  };

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<{ data: FinancialData }>(
          "GET",
          `${server}/patient/financial-insights?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
        );
        setFinancialData(response.data);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [dateRange]);

  const getPaymentMethods = () => {
    // Sample data - in a real app, this would come from the API
    return [
      { method: "Cash", amount: 15000 },
      { method: "Credit Card", amount: 12000 },
      { method: "UPI", amount: 18000 },
      { method: "Insurance", amount: 5000 }
    ];
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
                ₹{financialData?.daily.toLocaleString("en-IN") || 0}
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
                ₹{financialData?.weekly.toLocaleString("en-IN") || 0}
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
                ₹{financialData?.monthly.toLocaleString("en-IN") || 0}
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
                ₹{financialData?.total.toLocaleString("en-IN") || 0}
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
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
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
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]} />
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
                    {financialData?.revenueByTreatment?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]} />
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
                    {getPaymentMethods().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]} />
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