import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from '@/lib/api';
import { toast } from "@/components/ui/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';
import { UserCheck, Star, TrendingUp, Users, Calendar, DollarSign, Award } from 'lucide-react';
import { format } from 'date-fns';

interface DoctorPerformanceProps {
  dateRange: any;
  period: string;
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
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
    completionRate: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const DoctorPerformance: React.FC<DoctorPerformanceProps> = ({ dateRange, period }) => {
  const [loading, setLoading] = useState(true);
  const [doctorData, setDoctorData] = useState<DoctorPerformanceData | null>(null);

  useEffect(() => {
    fetchDoctorData();
  }, [dateRange, period]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const from = dateRange?.from?.toISOString();
      const to = dateRange?.to?.toISOString();

      const response: any = await crudRequest(
        'GET',
        `/analytics/doctors?startDate=${from}&endDate=${to}&period=${period}`
      );

      if (response.success && response.data) {
        setDoctorData(response.data);
      }
    } catch (error) {
      console.error('Error fetching doctor performance data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch doctor performance analytics data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return { variant: 'default' as const, label: 'Excellent' };
    if (rate >= 80) return { variant: 'secondary' as const, label: 'Good' };
    if (rate >= 70) return { variant: 'outline' as const, label: 'Average' };
    return { variant: 'destructive' as const, label: 'Needs Improvement' };
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

  if (!doctorData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No doctor performance data available for the selected period.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Date Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorData.patientsPerDoctor.length}</div>
            <p className="text-xs text-muted-foreground">
              Active doctors in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(
              doctorData.doctorRatings.length > 0 
                ? doctorData.doctorRatings.reduce((sum, d) => sum + d.averageRating, 0) / doctorData.doctorRatings.length 
                : 0
            )}`}>
              {doctorData.doctorRatings.length > 0 
                ? (doctorData.doctorRatings.reduce((sum, d) => sum + d.averageRating, 0) / doctorData.doctorRatings.length).toFixed(1)
                : 'N/A'} ⭐
            </div>
            <p className="text-xs text-muted-foreground">
              Overall doctor rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {doctorData.patientsPerDoctor.reduce((sum, d) => sum + d.patientCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Patients treated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {doctorData.doctorActivity.length > 0 
                ? (doctorData.doctorActivity.reduce((sum, d) => sum + d.completionRate, 0) / doctorData.doctorActivity.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average appointment completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Patient Load */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Load by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={doctorData.patientsPerDoctor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctorName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patientCount" fill="#8884d8" name="Total Patients" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Doctor Activity Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Performance by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={doctorData.doctorActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctorName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointmentCount" fill="#8884d8" name="Total Appointments" />
                <Bar dataKey="completedCount" fill="#00C49F" name="Completed" />
                <Bar dataKey="cancelledCount" fill="#FF8042" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Performance Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={doctorData.doctorActivity.map(doctor => ({
              doctorName: doctor.doctorName,
              completionRate: doctor.completionRate,
              patientSatisfaction: doctorData.doctorRatings.find(r => r.doctorId === doctor.doctorId)?.averageRating * 20 || 0,
              appointmentCount: (doctor.appointmentCount / Math.max(...doctorData.doctorActivity.map(d => d.appointmentCount))) * 100
            }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="doctorName" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Completion Rate"
                dataKey="completionRate"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.1}
              />
              <Radar
                name="Patient Satisfaction"
                dataKey="patientSatisfaction"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.1}
              />
              <Radar
                name="Activity Level"
                dataKey="appointmentCount"
                stroke="#FFBB28"
                fill="#FFBB28"
                fillOpacity={0.1}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Doctor Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Doctor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorData.patientsPerDoctor.map((doctor) => {
                const activity = doctorData.doctorActivity.find(a => a.doctorId === doctor.doctorId);
                const rating = doctorData.doctorRatings.find(r => r.doctorId === doctor.doctorId);
                const performance = getPerformanceBadge(activity?.completionRate || 0);

                return (
                  <TableRow key={doctor.doctorId}>
                    <TableCell className="font-medium">{doctor.doctorName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{doctor.patientCount} total</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{activity?.appointmentCount || 0} scheduled</div>
                        <div className="text-muted-foreground">
                          {activity?.completedCount || 0} completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {activity?.completionRate.toFixed(1) || 0}%
                        </div>
                        <Progress 
                          value={activity?.completionRate || 0} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className={getRatingColor(rating?.averageRating || 0)}>
                          {rating?.averageRating.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({rating?.reviewCount || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={performance.variant}>
                        {performance.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Doctor Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Ratings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctorData.doctorRatings.map((doctor) => (
              <div key={doctor.doctorId} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{doctor.doctorName}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className={getRatingColor(doctor.averageRating)}>
                      {doctor.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {doctor.reviewCount} reviews
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctorData.doctorActivity.map((doctor) => (
              <div key={doctor.doctorId} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{doctor.doctorName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Appointments</div>
                    <div className="font-medium">{doctor.appointmentCount}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Completed</div>
                    <div className="font-medium">{doctor.completedCount}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Completion Rate</div>
                    <div className="flex items-center gap-2">
                      <Progress value={doctor.completionRate} className="flex-1 h-2" />
                      <span className="font-medium">{doctor.completionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPerformance;