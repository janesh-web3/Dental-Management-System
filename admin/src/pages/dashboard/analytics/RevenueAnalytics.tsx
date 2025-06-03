import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { crudRequest } from "@/lib/api";
import { DateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { CHART_COLORS } from "../Analytics";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface RevenueAnalyticsProps {
  dateRange: DateRange;
  period: "daily" | "weekly" | "monthly";
}

interface RevenueData {
  revenueData: Array<{
    date: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  doctorRevenue: Array<{
    doctorId: string;
    doctorName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  }>;
  topPayingPatients: Array<{
    patientId: string;
    patientName: string;
    totalPaid: number;
    totalAmount: number;
    remainingAmount: number;
  }>;
  outstandingAmounts: Array<{
    patientId: string;
    patientName: string;
    contactNumber: string;
    totalRemaining: number;
  }>;
  overallRevenue: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
}

export default function RevenueAnalytics({ dateRange, period }: RevenueAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const from = dateRange.from?.toISOString();
        const to = dateRange.to?.toISOString();

        const response: any = await crudRequest(
          "GET",
          `/analytics/revenue?startDate=${from}&endDate=${to}&period=${period}`
        );
        if (response.success && response.data) {
          setData(response.data);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch revenue analytics."
          });
        }
      } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch revenue analytics."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, period]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-green-500">{formatCurrency(data?.overallRevenue?.totalAmount || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-green-500">{formatCurrency(data?.overallRevenue?.paidAmount || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-red-500">{formatCurrency(data?.overallRevenue?.remainingAmount || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-green-500">
                {data?.overallRevenue?.totalAmount
                  ? ((data.overallRevenue.paidAmount / data.overallRevenue.totalAmount) * 100).toFixed(1)
                  : "0"}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Over Time */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.revenueData && data.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="totalAmount" 
                    name="Total Amount" 
                    stackId="1" 
                    stroke={CHART_COLORS[0]} 
                    fill={CHART_COLORS[0]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paidAmount" 
                    name="Paid Amount" 
                    stackId="2" 
                    stroke={CHART_COLORS[1]} 
                    fill={CHART_COLORS[1]} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="remainingAmount" 
                    name="Remaining Amount" 
                    stackId="3" 
                    stroke={CHART_COLORS[2]} 
                    fill={CHART_COLORS[2]} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Doctor Revenue */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Doctor-wise Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.doctorRevenue && data.doctorRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.doctorRevenue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctorName" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="totalAmount" 
                    name="Total Amount" 
                    stackId="a" 
                    fill={CHART_COLORS[0]} 
                  />
                  <Bar 
                    dataKey="paidAmount" 
                    name="Paid Amount" 
                    stackId="b" 
                    fill={CHART_COLORS[1]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No doctor revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Top Paying Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Paying Patients</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] overflow-auto">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.topPayingPatients && data.topPayingPatients.length > 0 ? (
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Patient</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Paid</th>
                      <th className="text-right py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPayingPatients.map((patient, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{patient.patientName}</td>
                        <td className="text-right py-2">{formatCurrency(patient.totalAmount)}</td>
                        <td className="text-right py-2">{formatCurrency(patient.totalPaid)}</td>
                        <td className="text-right py-2">{formatCurrency(patient.remainingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No patient payment data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Outstanding Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Amounts</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] overflow-auto">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.outstandingAmounts && data.outstandingAmounts.length > 0 ? (
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Patient</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-right py-2">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.outstandingAmounts.map((patient, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{patient.patientName}</td>
                        <td className="py-2">{patient.contactNumber}</td>
                        <td className="text-right py-2">{formatCurrency(patient.totalRemaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No outstanding amounts data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
