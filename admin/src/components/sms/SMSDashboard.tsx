import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  X
} from 'lucide-react';
import { crudRequest } from '@/lib/api';

interface SMSLog {
  _id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled' | 'delivered';
  sentBy: {
    _id: string;
    name: string;
  };
  patient?: {
    _id: string;
    name: string;
  };
  templateUsed?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  deliveredAt?: string;
  errorMessage?: string;
}

interface DashboardStats {
  totalSMS: number;
  statusBreakdown: { _id: string; count: number }[];
  recentActivity: { _id: string; count: number }[];
  topTemplates: { name: string; totalSent: number }[];
}

interface DailyMessageVolume {
  date: string;
  sent: number;
  failed: number;
}

interface TemplateUsage {
  name: string;
  count: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export const SMSDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSMS: 0,
    statusBreakdown: [],
    recentActivity: [],
    topTemplates: []
  });
  const [dailyVolume, setDailyVolume] = useState<DailyMessageVolume[]>([]);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch SMS dashboard stats from the backend API
      const statsResponse = await crudRequest<{ data: any }>('GET', '/sms-dashboard/stats');
      
      // Fetch SMS logs from the backend API
      const logsResponse = await crudRequest<{ data: { history: SMSLog[] } }>('GET', '/sms-dashboard/history');
      
      // Fetch template analytics from the backend API
      const templateResponse = await crudRequest<{ data: any[] }>('GET', '/sms-dashboard/analytics/templates');
      
      // Fetch cost analytics from the backend API
      const costResponse = await crudRequest<{ data: { dailyCosts: any[] } }>('GET', '/sms-dashboard/analytics/costs');
      
      // Process the data for charts
      const processedStats: DashboardStats = {
        totalSMS: statsResponse.data?.totalSMS || 0,
        statusBreakdown: statsResponse.data?.statusBreakdown || [],
        recentActivity: statsResponse.data?.recentActivity || [],
        topTemplates: statsResponse.data?.topTemplates || []
      };
      
      // Process daily volume data
      const processedDailyVolume: DailyMessageVolume[] = costResponse.data?.dailyCosts?.map(item => ({
        date: item._id,
        sent: item.smsCount,
        failed: 0 // We would need to extract this from the data
      })) || [];
      
      // Process template usage data
      const processedTemplateUsage: TemplateUsage[] = templateResponse.data?.map(item => ({
        name: item._id,
        count: item.total
      })) || [];
      
      setStats(processedStats);
      setLogs(logsResponse.data?.history || []);
      setDailyVolume(processedDailyVolume);
      setTemplateUsage(processedTemplateUsage);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.recipient.includes(searchQuery) || 
                         log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.patient?.name && log.patient.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500">Delivered</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const exportLogs = () => {
    // Export functionality would go here
    toast.info('Export functionality would be implemented here');
  };

  // Calculate delivery rate from status breakdown
  const calculateDeliveryRate = () => {
    const delivered = stats.statusBreakdown.find(s => s._id === 'delivered')?.count || 0;
    const sent = stats.statusBreakdown.find(s => s._id === 'sent')?.count || 0;
    const total = delivered + sent;
    return total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0;
  };

  // Get counts for each status
  const getStatusCount = (status: string) => {
    return stats.statusBreakdown.find(s => s._id === status)?.count || 0;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze your SMS communication performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSMS.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time messages</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('delivered').toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('pending').toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('failed').toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Delivery failures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('scheduled').toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Future messages</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateDeliveryRate()}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
            <CardDescription>
              Distribution of message delivery statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusBreakdown.map(item => ({
                    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
                    value: item.count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Messages']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Template Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Template Usage</CardTitle>
            <CardDescription>
              Most frequently used SMS templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={templateUsage}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Usage Count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Message Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Message Volume</CardTitle>
            <CardDescription>
              Message volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dailyVolume}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#10B981" name="Sent" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" name="Failed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SMS Logs */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Logs</CardTitle>
          <CardDescription>
            Detailed history of sent messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by recipient, message, or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log._id}>
                    <TableCell>{log.recipient}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.sentBy?.name || 'System'}</TableCell>
                    <TableCell>{log.patient?.name || 'N/A'}</TableCell>
                    <TableCell>{log.templateUsed?.name || 'N/A'}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSDashboard;