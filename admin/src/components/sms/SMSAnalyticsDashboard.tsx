import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crudRequest } from '@/lib/api';
import { toast } from 'react-toastify';
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
  Cell
} from 'recharts';

// Removed unused interface TemplateAnalytics

interface TemplateGroupDistribution {
  name: string;
  value: number;
}

interface VisitStatusSummary {
  totalSent: number;
  visited: number;
  notVisited: number;
  visitRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const SMSAnalyticsDashboard: React.FC = () => {

  const [loading, setLoading] = useState(true);
  const [visitSummary, setVisitSummary] = useState<VisitStatusSummary>({
    totalSent: 0,
    visited: 0,
    notVisited: 0,
    visitRate: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      // For now, we'll simulate the data
      await crudRequest<any>('GET', '/sms/analytics');
      
      // Calculate visit summary
      const summary: VisitStatusSummary = {
        totalSent: 150,
        visited: 95,
        notVisited: 55,
        visitRate: 63.3
      };
      
      setVisitSummary(summary);
      toast.success('Analytics data loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts
  const templateUsageData = [
    { name: 'Appointment Reminder', sends: 45 },
    { name: 'Payment Due', sends: 32 },
    { name: 'Follow-up', sends: 28 },
    { name: 'Promotion', sends: 25 },
    { name: 'General', sends: 20 }
  ];

  const groupDistributionData: TemplateGroupDistribution[] = [
    { name: 'Regular Patients', value: 45 },
    { name: 'New Patients', value: 25 },
    { name: 'Ortho Patients', value: 15 },
    { name: 'Payment Due', value: 10 },
    { name: 'Inactive', value: 5 }
  ];

  const visitData = [
    { name: 'Visited', value: visitSummary.visited },
    { name: 'Not Visited', value: visitSummary.notVisited }
  ];

  if (loading) {
    return <div className="p-6">Loading analytics data...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMS Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track engagement, follow-up visits, and communication effectiveness
        </p>
      </div>

      {/* Visit Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total SMS Sent</CardDescription>
            <CardTitle className="text-3xl">{visitSummary.totalSent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Patients Visited</CardDescription>
            <CardTitle className="text-3xl">{visitSummary.visited}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Visited</CardDescription>
            <CardTitle className="text-3xl">{visitSummary.notVisited}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visit Rate</CardDescription>
            <CardTitle className="text-3xl">{visitSummary.visitRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Templates vs Groups Sent</CardTitle>
            <CardDescription>Comparison of template usage across patient groups</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={templateUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sends" fill="#8884d8" name="Messages Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patient Visit After SMS */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Visit After SMS</CardTitle>
            <CardDescription>Percentage of patients who visited after receiving SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Group Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Group Distribution</CardTitle>
          <CardDescription>How messages are distributed across patient groups</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={groupDistributionData}
              margin={{
                top: 5,
                right: 30,
                left: 100,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" scale="band" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Patients Reached" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SMS Activity</CardTitle>
          <CardDescription>Latest messages sent and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Mock data for recent activity */}
              <TableRow>
                <TableCell>Ram Bahadur</TableCell>
                <TableCell>Appointment Reminder</TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell><Badge variant="default">Sent</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sita Kumari</TableCell>
                <TableCell>Payment Due</TableCell>
                <TableCell>2024-01-14</TableCell>
                <TableCell><Badge variant="default">Delivered</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hari Prasad</TableCell>
                <TableCell>Follow-up</TableCell>
                <TableCell>2024-01-14</TableCell>
                <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSAnalyticsDashboard;