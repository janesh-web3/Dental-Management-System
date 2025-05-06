import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download,
  CalendarDays,
  Users,
  Clock,
  Activity,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";
import { CSVLink } from "react-csv";

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

interface DashboardMetrics {
  totalPatients: number;
  totalAppointments: number;
  patientGrowth: Array<{
    date: string;
    count: number;
  }>;
  appointmentDistribution: Array<{
    status: string;
    count: number;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export function Reports() {
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(2020, 0, 1), // Start from January 1, 2020 for all-time data
    to: new Date(),
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");

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
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await crudRequest<{ data: DashboardMetrics }>(
          "GET",
          `${server}/patient/dashboard-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
        );
        setMetrics(response.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const getCSVData = () => {
    if (!metrics) return [];
    
    switch (activeTab) {
      case "appointments":
        return metrics.appointmentDistribution.map(item => ({
          Status: item.status,
          Count: item.count,
        }));
      case "patients":
        return metrics.patientGrowth.map(item => ({
          Date: format(new Date(item.date), "yyyy-MM-dd"),
          "New Patients": item.count,
        }));
      case "demographics":
        return [
          { Category: "Total Patients", Count: metrics.totalPatients },
          { Category: "Total Appointments", Count: metrics.totalAppointments },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports & Analytics</CardTitle>
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
    <Card className="bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800 shadow-sm transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-violet-800 dark:text-violet-300">Reports & Analytics</CardTitle>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          {isCustomDateRange && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetDateRange}
              className="border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-300"
            >
              All Time Data
            </Button>
          )}
          <CSVLink
            data={getCSVData()}
            filename={`${activeTab}-report-${format(new Date(), "yyyy-MM-dd")}.csv`}
          >
            <Button 
              variant="outline" 
              size="sm"
              className="border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CSVLink>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-violet-700 dark:text-violet-400 mb-4">
          {isCustomDateRange ? (
            <p>
              Showing data from {format(dateRange.from, "MMM d, yyyy")} to {format(dateRange.to, "MMM d, yyyy")}
            </p>
          ) : (
            <p>Showing all-time data</p>
          )}
        </div>
        
        <Tabs 
          defaultValue="appointments" 
          className="space-y-4"
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-white dark:bg-violet-900">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-800 text-violet-800 dark:text-violet-300">
              <CalendarDays className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-800 text-violet-800 dark:text-violet-300">
              <Users className="h-4 w-4 mr-2" />
              Patient Growth
            </TabsTrigger>
            <TabsTrigger value="demographics" className="data-[state=active]:bg-violet-100 dark:data-[state=active]:bg-violet-800 text-violet-800 dark:text-violet-300">
              <Activity className="h-4 w-4 mr-2" />
              Demographics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">Total Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">{metrics?.totalAppointments || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">
                    {metrics?.appointmentDistribution?.length ? 
                      Math.round(
                        (metrics.appointmentDistribution.find(a => a.status === "accepted")?.count || 0) / 
                        metrics.appointmentDistribution.reduce((sum, item) => sum + item.count, 0) * 100
                      ) : 0}%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">Average per Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">
                    {metrics?.totalAppointments && dateRange.from && dateRange.to ? 
                      Math.round(metrics.totalAppointments / 
                        (Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) + 1)
                      ) : 0}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="h-[400px] w-full bg-white dark:bg-violet-900 p-4 rounded-lg shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics?.appointmentDistribution || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd7f7" />
                  <XAxis dataKey="status" stroke="#8b5cf6" />
                  <YAxis stroke="#8b5cf6" />
                  <Tooltip contentStyle={{ backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }} />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">Total Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">{metrics?.totalPatients || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">New in Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">
                    {metrics?.patientGrowth?.reduce((sum, item) => sum + item.count, 0) || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-900 dark:text-violet-50">
                    {metrics?.totalPatients && metrics?.patientGrowth ? 
                      Math.round(
                        (metrics.patientGrowth.reduce((sum, item) => sum + item.count, 0) / 
                        metrics.totalPatients) * 100
                      ) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="h-[400px] w-full bg-white dark:bg-violet-900 p-4 rounded-lg shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics?.patientGrowth || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd7f7" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    stroke="#8b5cf6" 
                  />
                  <YAxis stroke="#8b5cf6" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                    contentStyle={{ backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="New Patients"
                    activeDot={{ r: 8, fill: "#7c3aed" }}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="text-violet-800 dark:text-violet-300">Patient Age Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '0-18', value: 30 },
                          { name: '19-35', value: 45 },
                          { name: '36-50', value: 35 },
                          { name: '51-65', value: 25 },
                          { name: '65+', value: 15 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[0, 1, 2, 3, 4].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-violet-900 border-violet-100 dark:border-violet-700 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle className="text-violet-800 dark:text-violet-300">Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Male', value: 120 },
                          { name: 'Female', value: 150 },
                          { name: 'Other', value: 5 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 