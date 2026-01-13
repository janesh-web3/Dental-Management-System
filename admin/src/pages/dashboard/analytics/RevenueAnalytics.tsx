import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crudRequest } from '@/lib/api';
import { toast } from "@/components/ui/use-toast";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';
import { format } from 'date-fns';

interface RevenueAnalyticsProps {
  dateRange: any;
  period: string;
}

interface RevenueData {
  revenueData: Array<{
    date: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  doctorRevenue: Array<{
    doctorName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  topPayingPatients: Array<{
    patientName: string;
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
  }>;
  outstandingAmounts: Array<{
    patientName: string;
    totalRemaining: number;
    contactNumber: string;
  }>;
  overallRevenue: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
  revenueBreakdown: {
    treatmentRevenue: {
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
    };
    servicePayments: {
      totalAmount: number;
      count: number;
    };
    income: {
      totalAmount: number;
      count: number;
    };
  };
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ dateRange, period }) => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange, period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const from = dateRange?.from?.toISOString();
      const to = dateRange?.to?.toISOString();

      const response: any = await crudRequest(
        'GET',
        `/analytics/revenue?startDate=${from}&endDate=${to}&period=${period}`
      );

      if (response.success && response.data) {
        setRevenueData(response.data);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch revenue analytics data.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No revenue data available for the selected period.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Date Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieChartData = [
    { name: 'Paid', value: revenueData.overallRevenue.paidAmount, color: '#00C49F' },
    { name: 'Pending', value: revenueData.overallRevenue.remainingAmount, color: '#FF8042' }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {revenueData.overallRevenue.totalAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Revenue from all sources
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">NPR {revenueData.overallRevenue.paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((revenueData.overallRevenue.paidAmount / revenueData.overallRevenue.totalAmount) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">NPR {revenueData.overallRevenue.remainingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((revenueData.overallRevenue.remainingAmount / revenueData.overallRevenue.totalAmount) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {((revenueData.overallRevenue.paidAmount / revenueData.overallRevenue.totalAmount) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Payment collection efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis tickFormatter={(value) => `NPR ${value.toLocaleString()}`} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value: number, name: string) => [
                    `NPR ${value.toLocaleString()}`, 
                    name === 'totalAmount' ? 'Total Revenue' : 
                    name === 'paidAmount' ? 'Paid Amount' : 'Pending Amount'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#8884d8" 
                  name="Total Revenue"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="paidAmount" 
                  stroke="#00C49F" 
                  name="Paid Amount"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="remainingAmount" 
                  stroke="#FF8042" 
                  name="Pending Amount"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `NPR ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Revenue Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Revenue Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData.doctorRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="doctorName" />
              <YAxis tickFormatter={(value) => `NPR ${value.toLocaleString()}`} />
              <Tooltip formatter={(value: number) => `NPR ${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="totalAmount" fill="#8884d8" name="Total Revenue" />
              <Bar dataKey="paidAmount" fill="#00C49F" name="Paid Amount" />
              <Bar dataKey="remainingAmount" fill="#FF8042" name="Pending Amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Treatment Revenue</p>
                <p className="text-sm text-muted-foreground">From patient treatments</p>
              </div>
              <div className="text-right">
                <p className="font-bold">NPR {revenueData.revenueBreakdown.treatmentRevenue.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-green-600">NPR {revenueData.revenueBreakdown.treatmentRevenue.paidAmount.toLocaleString()} paid</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Service Payments</p>
                <p className="text-sm text-muted-foreground">{revenueData.revenueBreakdown.servicePayments.count} transactions</p>
              </div>
              <div className="text-right">
                <p className="font-bold">NPR {revenueData.revenueBreakdown.servicePayments.totalAmount.toLocaleString()}</p>
                <Badge variant="default">Fully Paid</Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium">Other Income</p>
                <p className="text-sm text-muted-foreground">{revenueData.revenueBreakdown.income.count} entries</p>
              </div>
              <div className="text-right">
                <p className="font-bold">NPR {revenueData.revenueBreakdown.income.totalAmount.toLocaleString()}</p>
                <Badge variant="default">Fully Paid</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Paying Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Paying Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.topPayingPatients.slice(0, 5).map((patient, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{patient.patientName}</TableCell>
                    <TableCell>NPR {patient.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">NPR {patient.totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-orange-600">NPR {patient.remainingAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueAnalytics;