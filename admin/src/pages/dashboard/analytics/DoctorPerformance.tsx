import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { crudRequest } from "@/lib/api";
import { DateRange } from "react-day-picker";
import { toast } from "@/components/ui/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { CHART_COLORS } from "../Analytics";
import {
  UserCheck,
  Star,
  Activity,
} from "lucide-react";

interface DoctorPerformanceProps {
  dateRange: DateRange;
}

interface DoctorPerformanceData {
  patientsPerDoctor: Array<{
    doctorId: string;
    doctorName: string;
    patientCount: number;
  }>;
  doctorRatings: Array<{
    doctorId: string;
    doctorName: string;
    averageRating: number;
    reviewCount: number;
  }>;
  doctorActivity: Array<{
    doctorId: string;
    doctorName: string;
    appointmentCount: number;
    completedCount: number;
    cancelledCount: number;
    completionRate: number;
  }>;
  mostActiveDoctor: {
    doctorId: string;
    doctorName: string;
    appointmentCount: number;
  };
  leastActiveDoctor: {
    doctorId: string;
    doctorName: string;
    appointmentCount: number;
  };
  highestRatedDoctor: {
    doctorId: string;
    doctorName: string;
    averageRating: number;
    reviewCount: number;
  };
}

export default function DoctorPerformance({ dateRange }: DoctorPerformanceProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DoctorPerformanceData | null>(null);

  useEffect(() => {
    fetchDoctorPerformance();
  }, [dateRange]);

  const fetchDoctorPerformance = async () => {
    try {
      setLoading(true);
      
      const from = dateRange.from?.toISOString();
      const to = dateRange.to?.toISOString();
      
      const response: any = await crudRequest(
        "GET",
        `/analytics/doctors?startDate=${from}&endDate=${to}`
      );
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch doctor performance analytics."
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching doctor performance:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch doctor performance analytics."
      });
    }
  };
  
  // Format rating with star emoji
  const formatRating = (rating: number) => {
    return `${rating.toFixed(1)} ⭐`;
  };
  
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

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Doctor</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{data?.mostActiveDoctor?.doctorName || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.mostActiveDoctor ? `${data.mostActiveDoctor.appointmentCount} appointments` : "No data"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Rated Doctor</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{data?.highestRatedDoctor?.doctorName || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.highestRatedDoctor 
                    ? `${formatRating(data.highestRatedDoctor.averageRating)} (${data.highestRatedDoctor.reviewCount} reviews)` 
                    : "No ratings"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Least Active Doctor</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{data?.leastActiveDoctor?.doctorName || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.leastActiveDoctor ? `${data.leastActiveDoctor.appointmentCount} appointments` : "No data"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patients Per Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Patients Per Doctor</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.patientsPerDoctor && data.patientsPerDoctor.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.patientsPerDoctor}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctorName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="patientCount" 
                    name="Patient Count" 
                    fill={CHART_COLORS[0]}
                  >
                    {data.patientsPerDoctor.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No patient data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Doctor Ratings */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Ratings</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.doctorRatings && data.doctorRatings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.doctorRatings}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctorName" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="averageRating" 
                    name="Average Rating" 
                    fill={CHART_COLORS[1]}
                  >
                    {data.doctorRatings.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No rating data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Doctor Activity */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Doctor Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.doctorActivity && data.doctorActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={150} width={730} height={350} data={data.doctorActivity}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="doctorName" />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                  <Radar
                    name="Appointments"
                    dataKey="appointmentCount"
                    stroke={CHART_COLORS[0]}
                    fill={CHART_COLORS[0]}
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Completed"
                    dataKey="completedCount"
                    stroke={CHART_COLORS[1]}
                    fill={CHART_COLORS[1]}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No activity data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Completion Rate Table */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Doctor Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : data?.doctorActivity && data.doctorActivity.length > 0 ? (
              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Doctor</th>
                      <th className="text-right py-2">Appointments</th>
                      <th className="text-right py-2">Completed</th>
                      <th className="text-right py-2">Cancelled</th>
                      <th className="text-right py-2">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.doctorActivity.map((doctor, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{doctor.doctorName}</td>
                        <td className="text-right py-2">{doctor.appointmentCount}</td>
                        <td className="text-right py-2">{doctor.completedCount}</td>
                        <td className="text-right py-2">{doctor.cancelledCount}</td>
                        <td className="text-right py-2">{doctor.completionRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
