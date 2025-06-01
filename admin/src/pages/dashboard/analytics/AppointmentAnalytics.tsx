import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { crudRequest } from "@/lib/api";
import { DateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
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
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { CHART_COLORS } from "../Analytics";
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AppointmentAnalyticsProps {
  dateRange: DateRange;
  period: "daily" | "weekly" | "monthly";
}

interface AppointmentData {
  totalAppointments: number;
  appointmentsByStatus: Array<{
    _id: string;
    count: number;
  }>;
  genderDistribution: Array<{
    _id: string;
    count: number;
  }>;
  doctorAppointments: Array<{
    _id: string;
    doctorName: string;
    count: number;
  }>;
  noShowRate: number;
  appointmentsOverTime: Array<{
    date: string;
    count: number;
  }>;
}

export default function AppointmentAnalytics({ dateRange, period }: AppointmentAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppointmentData | null>(null);

  useEffect(() => {
    fetchAppointmentAnalytics();
  }, [dateRange, period]);

  const fetchAppointmentAnalytics = async () => {
    try {
      setLoading(true);
      
      const from = dateRange.from?.toISOString();
      const to = dateRange.to?.toISOString();
      
      const response: any = await crudRequest(
        "GET",
        `/analytics/appointments?startDate=${from}&endDate=${to}&period=${period}`
      );
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch appointment analytics."
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointment analytics:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch appointment analytics."
      });
    }
  };

  // We're not using this function anymore
  // const formatStatusData = () => {
  //   if (!data?.appointmentsByStatus) return [];
  //   
  //   return data.appointmentsByStatus.map(item => ({
  //     name: item._id,
  //     value: item.count
  //   }));
  // };
  
  // We're not using this function anymore
  // const formatGenderData = () => {
  //   if (!data?.genderDistribution) return [];
  //   
  //   return data.genderDistribution.map(item => ({
  //     name: item._id,
  //     value: item.count
  //   }));
  // };
  
  // We're not using this tooltip anymore
  // const CustomTooltip = ({ active, payload, label }: any) => {
  //   if (active && payload && payload.length) {
  //     return (
  //       <div className="bg-background p-3 border rounded-md shadow-md">
  //         <p className="font-medium">{`${label}`}</p>
  //         {payload.map((entry: any, index: number) => (
  //           <p key={index} style={{ color: entry.color }}>
  //             {`${entry.name}: ${entry.value}`}
  //           </p>
  //         ))}
  //       </div>
  //     );
  //   }
  //   return null;
  // };

  // We're not using this function anymore, removing it
  // const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  //   const RADIAN = Math.PI / 180;
  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);

  //   return (
  //     <text 
  //       x={x} 
  //       y={y} 
  //       fill="white" 
  //       textAnchor={x > cx ? 'start' : 'end'} 
  //       dominantBaseline="central"
  //       fontSize={12}
  //     >
  //       {`${name} ${(percent * 100).toFixed(0)}%`}
  // Appointments over time chart
  const renderAppointmentsOverTime = () => {
    if (!data?.appointmentsOverTime || data.appointmentsOverTime.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No appointment data available</p>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data.appointmentsOverTime}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Status distribution chart
  const renderStatusDistribution = () => {
    if (!data?.appointmentsByStatus || data.appointmentsByStatus.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No status data available</p>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.appointmentsByStatus}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            nameKey="_id"
            label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.appointmentsByStatus.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Doctor appointments chart
  const renderDoctorAppointments = () => {
    if (!data?.doctorAppointments || data.doctorAppointments.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No doctor appointment data available</p>
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.doctorAppointments}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="doctorName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Appointments" fill="#0088FE">
            {data.doctorAppointments.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{data?.totalAppointments || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.appointmentsByStatus?.find(s => s._id === "Completed")
                  ? ((data.appointmentsByStatus.find(s => s._id === "Completed")?.count || 0) / data.totalAppointments * 100).toFixed(1)
                  : "0"}%
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{data?.noShowRate.toFixed(1) || "0"}%</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.appointmentsByStatus?.find(s => s._id === "Cancelled")
                  ? ((data.appointmentsByStatus.find(s => s._id === "Cancelled")?.count || 0) / data.totalAppointments * 100).toFixed(1)
                  : "0"}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Appointments Over Time */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointments Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              renderAppointmentsOverTime()
            )}
          </CardContent>
        </Card>
        
        {/* Appointments by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              renderStatusDistribution()
            )}
          </CardContent>
        </Card>
        
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.appointmentsByStatus && data.appointmentsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="_id"
                    label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.appointmentsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No gender data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Doctor-wise Appointment Count */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Doctor-wise Appointment Count</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              renderDoctorAppointments()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
