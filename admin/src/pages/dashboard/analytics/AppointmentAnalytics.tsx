import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentAnalyticsProps {
  dateRange: any;
  period: string;
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
    doctorName: string;
    count: number;
  }>;
  noShowRate: number;
  appointmentsOverTime: Array<{
    date: string;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const AppointmentAnalytics: React.FC<AppointmentAnalyticsProps> = ({ dateRange, period }) => {
  const [loading, setLoading] = useState(true);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);

  useEffect(() => {
    fetchAppointmentData();
  }, [dateRange, period]);

  const fetchAppointmentData = async () => {
    try {
      setLoading(true);
      const from = dateRange?.from?.toISOString();
      const to = dateRange?.to?.toISOString();

      const response: any = await crudRequest(
        'GET',
        `/analytics/appointments?startDate=${from}&endDate=${to}&period=${period}`
      );

      if (response.success && response.data) {
        setAppointmentData(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointment data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch appointment analytics data.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Commented out unused helper functions
  // const getStatusColor = (status: string) => {
  //   switch (status.toLowerCase()) {
  //     case 'completed': return 'text-green-600';
  //     case 'cancelled': return 'text-red-600';
  //     case 'scheduled': return 'text-blue-600';
  //     case 'no-show': return 'text-orange-600';
  //     default: return 'text-gray-600';
  //   }
  // };

  // const getStatusBadgeVariant = (status: string) => {
  //   switch (status.toLowerCase()) {
  //     case 'completed': return 'default';
  //     case 'cancelled': return 'destructive';
  //     case 'scheduled': return 'secondary';
  //     case 'no-show': return 'outline';
  //     default: return 'secondary';
  //   }
  // };

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

  if (!appointmentData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No appointment data available for the selected period.</p>
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
      {/* Appointment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentData.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointmentData.appointmentsByStatus.find(s => s._id === 'Completed')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentData.totalAppointments > 0 
                ? (((appointmentData.appointmentsByStatus.find(s => s._id === 'Completed')?.count || 0) / appointmentData.totalAppointments) * 100).toFixed(1)
                : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {appointmentData.appointmentsByStatus.find(s => s._id === 'Cancelled')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentData.totalAppointments > 0 
                ? (((appointmentData.appointmentsByStatus.find(s => s._id === 'Cancelled')?.count || 0) / appointmentData.totalAppointments) * 100).toFixed(1)
                : 0}% cancellation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{appointmentData.noShowRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Patient no-show rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointmentData.appointmentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  name="Appointments"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentData.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {appointmentData.appointmentsByStatus.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Performance and Time Slot Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentData.doctorAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="doctorName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Total Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentData.genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, count }) => `${_id}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {appointmentData.genderDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Types and Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentData.appointmentsByStatus.map((status, index) => (
                <div key={status._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{status._id}</span>
                  </div>
                  <Badge variant="secondary">{status.count} appointments</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Doctor Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointmentData.doctorAppointments.slice(0, 5).map((doctor, index) => (
                <div key={doctor.doctorName} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{doctor.doctorName || 'Unknown Doctor'}</span>
                  </div>
                  <Badge variant="secondary">{doctor.count} appointments</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Information */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{appointmentData.totalAppointments}</div>
              <div className="text-sm text-muted-foreground">Total Appointments</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {appointmentData.appointmentsByStatus.find(s => s._id === 'Completed')?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{appointmentData.noShowRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">No-Show Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAnalytics;