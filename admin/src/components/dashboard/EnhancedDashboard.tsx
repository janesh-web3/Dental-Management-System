import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crudRequest } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  CreditCard,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  Receipt,
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  MessageSquare,
  Stethoscope,
  Calendar as CalendarView
} from 'lucide-react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  overview: {
    totalPatients: number;
    newPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    pendingPayments: number;
    smsSent: number;
    activeTreatments: number;
  };
  trends: {
    patientGrowth: Array<{ date: string; count: number; }>;
    revenueGrowth: Array<{ date: string; amount: number; }>;
    appointmentTrends: Array<{ date: string; scheduled: number; completed: number; }>;
    smsUsage: Array<{ date: string; sent: number; }>;
  };
  breakdown: {
    paymentMethods: Array<{ method: string; count: number; amount: number; }>;
    treatmentTypes: Array<{ treatment: string; count: number; revenue: number; }>;
    ageGroups: Array<{ group: string; count: number; }>;
    genderDistribution: Array<{ gender: string; count: number; }>;
    patientStatusDistribution: Array<{ status: string; count: number; }>;
  };
  recent: {
    patients: Array<any>;
    appointments: Array<any>;
    payments: Array<any>;
    messages: Array<any>;
  };
}

type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom' | 'last_7_days' | 'last_30_days' | 'last_90_days';

interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export const EnhancedDashboard: React.FC = () => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [refreshing, setRefreshing] = useState(false);

  // Calculate date range based on filter
  const dateRange = useMemo((): DateRange => {
    const now = new Date();

    switch (selectedDateFilter) {
      case 'today':
        return {
          from: startOfDay(now),
          to: endOfDay(now),
          label: 'Today'
        };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday),
          label: 'Yesterday'
        };
      case 'this_week':
        return {
          from: startOfWeek(now),
          to: endOfWeek(now),
          label: 'This Week'
        };
      case 'last_week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1));
        return {
          from: lastWeekStart,
          to: endOfWeek(lastWeekStart),
          label: 'Last Week'
        };
      case 'this_month':
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
          label: 'This Month'
        };
      case 'last_month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        return {
          from: lastMonthStart,
          to: endOfMonth(lastMonthStart),
          label: 'Last Month'
        };
      case 'this_year':
        return {
          from: startOfYear(now),
          to: endOfYear(now),
          label: 'This Year'
        };
      case 'last_year':
        const lastYearStart = startOfYear(subYears(now, 1));
        return {
          from: lastYearStart,
          to: endOfYear(lastYearStart),
          label: 'Last Year'
        };
      case 'last_7_days':
        return {
          from: startOfDay(subDays(now, 6)),
          to: endOfDay(now),
          label: 'Last 7 Days'
        };
      case 'last_30_days':
        return {
          from: startOfDay(subDays(now, 29)),
          to: endOfDay(now),
          label: 'Last 30 Days'
        };
      case 'last_90_days':
        return {
          from: startOfDay(subDays(now, 89)),
          to: endOfDay(now),
          label: 'Last 90 Days'
        };
      case 'custom':
        return {
          from: customDateRange.from || startOfMonth(now),
          to: customDateRange.to || endOfMonth(now),
          label: `${customDateRange.from ? format(customDateRange.from, 'MMM dd') : 'Start'} - ${customDateRange.to ? format(customDateRange.to, 'MMM dd') : 'End'}`
        };
      default:
        return {
          from: startOfMonth(now),
          to: endOfMonth(now),
          label: 'This Month'
        };
    }
  }, [selectedDateFilter, customDateRange]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', dateRange.from, dateRange.to],
    queryFn: async () => {
      const response = await crudRequest<DashboardData>('GET', '/patients/dashboard-metrics', {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });
      return response;
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!dashboardData) return;

    const exportData = {
      period: dateRange.label,
      generatedAt: new Date().toISOString(),
      data: dashboardData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Error loading dashboard</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your dental practice for {dateRange.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedDateFilter} onValueChange={(value: DateFilterType) => setSelectedDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <Badge variant="outline">
              {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {dashboardData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.totalPatients.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData.overview.newPatients} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">NPR {dashboardData.overview.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  NPR {dashboardData.overview.pendingPayments.toLocaleString()} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <CalendarView className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.completedAppointments} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.smsSent}</div>
                <p className="text-xs text-muted-foreground">
                  Communication sent
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line
                    data={{
                      labels: dashboardData.trends.revenueGrowth.map(item => format(new Date(item.date), 'MMM dd')),
                      datasets: [
                        {
                          label: 'Revenue',
                          data: dashboardData.trends.revenueGrowth.map(item => item.amount),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                          fill: true
                        }
                      ]
                    }}
                    options={chartOptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patient Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Growth</CardTitle>
                <CardDescription>New patient registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: dashboardData.trends.patientGrowth.map(item => format(new Date(item.date), 'MMM dd')),
                      datasets: [
                        {
                          label: 'New Patients',
                          data: dashboardData.trends.patientGrowth.map(item => item.count),
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                          borderColor: 'rgb(34, 197, 94)',
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={chartOptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: dashboardData.breakdown.paymentMethods.map(item => item.method),
                      datasets: [
                        {
                          data: dashboardData.breakdown.paymentMethods.map(item => item.amount),
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(168, 85, 247, 0.8)'
                          ],
                          borderColor: [
                            'rgb(59, 130, 246)',
                            'rgb(34, 197, 94)',
                            'rgb(251, 191, 36)',
                            'rgb(239, 68, 68)',
                            'rgb(168, 85, 247)'
                          ],
                          borderWidth: 2
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Treatment Types */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Treatments</CardTitle>
                <CardDescription>Most performed treatments by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.breakdown.treatmentTypes.slice(0, 5).map((treatment, index) => (
                    <div key={treatment.treatment} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{treatment.treatment}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">NPR {treatment.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{treatment.count} treatments</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <Tabs defaultValue="patients" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patients">Recent Patients</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patient Registrations</CardTitle>
                  <CardDescription>Latest patients registered in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recent.patients.slice(0, 10).map((patient, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>{patient.phone}</TableCell>
                          <TableCell>{format(new Date(patient.registrationDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                              {patient.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                  <CardDescription>Latest appointments in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Doctor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recent.appointments.slice(0, 10).map((appointment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{appointment.patientName}</TableCell>
                          <TableCell>{format(new Date(appointment.datetime), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>{appointment.type}</TableCell>
                          <TableCell>
                            <Badge variant={
                              appointment.status === 'completed' ? 'default' :
                              appointment.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }>
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{appointment.doctor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest payments received in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recent.payments.slice(0, 10).map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{payment.patientName}</TableCell>
                          <TableCell>NPR {payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.method}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(payment.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{payment.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Gender Distribution</h4>
                      {dashboardData.breakdown.genderDistribution.map(item => (
                        <div key={item.gender} className="flex justify-between items-center py-1">
                          <span className="text-sm capitalize">{item.gender}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Patient Status Distribution</h4>
                      {dashboardData.breakdown.patientStatusDistribution.map(item => (
                        <div key={item.status} className="flex justify-between items-center py-1">
                          <span className="text-sm">{item.status} Patients</span>
                          <Badge
                            variant="secondary"
                            className={item.status === 'New'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                            }
                          >
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Age Groups</h4>
                      {dashboardData.breakdown.ageGroups.map(item => (
                        <div key={item.group} className="flex justify-between items-center py-1">
                          <span className="text-sm">{item.group}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Appointment Completion Rate</span>
                        <span className="font-medium">
                          {Math.round((dashboardData.overview.completedAppointments / dashboardData.overview.totalAppointments) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue per Patient</span>
                        <span className="font-medium">
                          NPR {Math.round(dashboardData.overview.totalRevenue / dashboardData.overview.totalPatients).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Active Treatments</span>
                        <span className="font-medium">{dashboardData.overview.activeTreatments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">SMS Engagement</span>
                        <span className="font-medium">{dashboardData.overview.smsSent} messages</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default EnhancedDashboard;