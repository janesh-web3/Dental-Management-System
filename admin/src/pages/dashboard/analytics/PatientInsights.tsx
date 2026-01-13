import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { crudRequest } from '@/lib/api';
import { toast } from "@/components/ui/use-toast";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { Users, UserPlus, Calendar, Phone, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface PatientInsightsProps {
  dateRange: any;
  period: string;
}

interface PatientInsightsData {
  patientTypeData: Array<{
    date: string;
    newPatients: number;
    returningPatients?: number;
  }>;
  treatmentCompletionRate: {
    totalTreatments: number;
    completedTreatments: number;
    completionRate: number;
  };
  followUpData: {
    overdueFollowUps: number;
    upcomingFollowUps: number;
    details: Array<{
      patientId: string;
      patientName: string;
      contactNumber: string;
      followUpDate: string;
      isOverdue: boolean;
    }>;
  };
}

const PatientInsights: React.FC<PatientInsightsProps> = ({ dateRange, period }) => {
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientInsightsData | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, [dateRange, period]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const from = dateRange?.from?.toISOString();
      const to = dateRange?.to?.toISOString();

      const response: any = await crudRequest(
        'GET',
        `/analytics/patients?startDate=${from}&endDate=${to}&period=${period}`
      );

      if (response.success && response.data) {
        setPatientData(response.data);
      }
    } catch (error) {
      console.error('Error fetching patient insights data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch patient insights analytics data.",
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

  if (!patientData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No patient insights data available for the selected period.</p>
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
            <CardTitle className="text-sm font-medium">New Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientData.patientTypeData.reduce((sum, d) => sum + d.newPatients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Completion</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {patientData.treatmentCompletionRate.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {patientData.treatmentCompletionRate.completedTreatments} of {patientData.treatmentCompletionRate.totalTreatments} treatments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Patients</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {patientData.patientTypeData.reduce((sum, d) => sum + (d.returningPatients || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Patient return visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Follow-ups</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{patientData.followUpData.overdueFollowUps}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={patientData.patientTypeData}>
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
                <Area 
                  type="monotone" 
                  dataKey="newPatients" 
                  stackId="1"
                  stroke="#00C49F" 
                  fill="#00C49F"
                  name="New Patients"
                />
                {patientData.patientTypeData.some(d => d.returningPatients) && (
                  <Area 
                    type="monotone" 
                    dataKey="returningPatients" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    name="Returning Patients"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Treatment Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Completion Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {patientData.treatmentCompletionRate.completionRate.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Completion Rate</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {patientData.treatmentCompletionRate.completedTreatments}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {patientData.treatmentCompletionRate.totalTreatments - patientData.treatmentCompletionRate.completedTreatments}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              <Progress 
                value={patientData.treatmentCompletionRate.completionRate} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Management */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{patientData.followUpData.overdueFollowUps}</div>
              <div className="text-sm text-muted-foreground">Overdue Follow-ups</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{patientData.followUpData.upcomingFollowUps}</div>
              <div className="text-sm text-muted-foreground">Upcoming Follow-ups</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Follow-up Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patientData.followUpData.details.slice(0, 10).map((followUp, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{followUp.patientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {followUp.contactNumber || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(followUp.followUpDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={followUp.isOverdue ? 'destructive' : 'default'}>
                      {followUp.isOverdue ? 'Overdue' : 'Scheduled'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientInsights;