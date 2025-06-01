import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { crudRequest } from "@/lib/api";
import { DateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CHART_COLORS } from "../Analytics";
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface PatientInsightsProps {
  dateRange: DateRange;
  period: "daily" | "weekly" | "monthly";
}

interface PatientInsightsData {
  patientTypeData: Array<{
    date: string;
    newPatients: number;
    returningPatients: number;
  }>;
  treatmentCompletionRate: {
    completedCount: number;
    totalCount: number;
    completionRate: number;
  };
  followUpData: {
    upcomingCount: number;
    overdueCount: number;
    totalCount: number;
    details: Array<{
      patientId: string;
      patientName: string;
      contactNumber: string;
      followUpDate: string;
      isOverdue: boolean;
    }>;
  };
}

export default function PatientInsights({ dateRange, period }: PatientInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PatientInsightsData | null>(null);

  useEffect(() => {
    fetchPatientInsights();
  }, [dateRange, period]);

  const fetchPatientInsights = async () => {
    try {
      setLoading(true);
      
      const from = dateRange.from?.toISOString();
      const to = dateRange.to?.toISOString();
      
      const response: any = await crudRequest(
        "GET",
        `/analytics/patients?startDate=${from}&endDate=${to}&period=${period}`
      );
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch patient insights."
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient insights:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch patient insights."
      });
    }
  };
  
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.treatmentCompletionRate?.completionRate.toFixed(1) || "0"}%
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Follow-ups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{data?.followUpData?.upcomingCount || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Follow-ups</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{data?.followUpData?.overdueCount || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New vs Returning Ratio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.patientTypeData && data.patientTypeData.length > 0
                  ? calculateNewReturningRatio(data.patientTypeData)
                  : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New vs Returning Patients */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>New vs Returning Patients</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.patientTypeData && data.patientTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.patientTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="newPatients" 
                    name="New Patients" 
                    stackId="a" 
                    fill={CHART_COLORS[0]} 
                  />
                  <Bar 
                    dataKey="returningPatients" 
                    name="Returning Patients" 
                    stackId="a" 
                    fill={CHART_COLORS[1]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No patient type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Treatment Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Completion</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.treatmentCompletionRate ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: data.treatmentCompletionRate.completedCount },
                      { name: 'Incomplete', value: data.treatmentCompletionRate.totalCount - data.treatmentCompletionRate.completedCount }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={CHART_COLORS[1]} />
                    <Cell fill={CHART_COLORS[2]} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No treatment completion data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Follow-up Status */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.followUpData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Upcoming', value: data.followUpData.upcomingCount },
                      { name: 'Overdue', value: data.followUpData.overdueCount }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={CHART_COLORS[3]} />
                    <Cell fill={CHART_COLORS[4]} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No follow-up data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Follow-up Details */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Follow-up Details</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.followUpData?.details && data.followUpData.details.length > 0 ? (
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Patient</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Follow-up Date</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.followUpData.details.map((followUp, index) => (
                      <tr key={index} className={`border-b ${followUp.isOverdue ? 'text-red-500' : ''}`}>
                        <td className="py-2">{followUp.patientName}</td>
                        <td className="py-2">{followUp.contactNumber}</td>
                        <td className="py-2">{format(new Date(followUp.followUpDate), 'MMM dd, yyyy')}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${followUp.isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {followUp.isOverdue ? 'Overdue' : 'Upcoming'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No follow-up details available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to calculate new vs returning ratio
function calculateNewReturningRatio(data: Array<{ newPatients: number; returningPatients: number }>) {
  const totalNew = data.reduce((sum, item) => sum + item.newPatients, 0);
  const totalReturning = data.reduce((sum, item) => sum + item.returningPatients, 0);
  
  if (totalReturning === 0) return "∞";
  
  const ratio = totalNew / totalReturning;
  return ratio.toFixed(1) + ":1";
}

// Custom label for pie charts
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
