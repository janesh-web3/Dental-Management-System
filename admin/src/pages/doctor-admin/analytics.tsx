import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, BarChart3, PieChart, LineChart, Calendar, Download
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsProps {
  doctorId: string;
}

interface AnalyticsData {
  patientCountByMonth: Array<{
    year: number;
    month: number;
    count: number;
  }>;
  commonProcedures: Array<{
    _id: string;
    count: number;
  }>;
  treatmentOutcomes: Array<{
    _id: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    year: number;
    month: number;
    revenue: number;
  }>;
}

const Analytics: React.FC<AnalyticsProps> = ({ doctorId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<string>("last30days");
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [doctorId, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in a real implementation
      // For now, we'll simulate the data
      setTimeout(() => {
        setAnalyticsData({
          patientCountByMonth: [
            { year: 2025, month: 1, count: 12 },
            { year: 2025, month: 2, count: 15 },
            { year: 2025, month: 3, count: 18 },
            { year: 2025, month: 4, count: 14 },
            { year: 2025, month: 5, count: 20 },
          ],
          commonProcedures: [
            { _id: "Dental Examination", count: 45 },
            { _id: "Cavity Filling", count: 32 },
            { _id: "Root Canal", count: 18 },
            { _id: "Tooth Extraction", count: 12 },
            { _id: "Teeth Cleaning", count: 28 },
          ],
          treatmentOutcomes: [
            { _id: "Completed", count: 65 },
            { _id: "Active", count: 25 },
            { _id: "Cancelled", count: 10 },
          ],
          revenueByMonth: [
            { year: 2025, month: 1, revenue: 5200 },
            { year: 2025, month: 2, revenue: 6100 },
            { year: 2025, month: 3, revenue: 7300 },
            { year: 2025, month: 4, revenue: 5800 },
            { year: 2025, month: 5, revenue: 8200 },
          ],
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analytics data",
      });
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // Prepare data for patient count chart
  const patientCountData = {
    labels: analyticsData?.patientCountByMonth.map(item => `${getMonthName(item.month)} ${item.year}`) || [],
    datasets: [
      {
        label: 'Patient Count',
        data: analyticsData?.patientCountByMonth.map(item => item.count) || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Prepare data for common procedures chart
  const commonProceduresData = {
    labels: analyticsData?.commonProcedures.map(item => item._id) || [],
    datasets: [
      {
        label: 'Procedures',
        data: analyticsData?.commonProcedures.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for treatment outcomes chart
  const treatmentOutcomesData = {
    labels: analyticsData?.treatmentOutcomes.map(item => item._id) || [],
    datasets: [
      {
        label: 'Treatment Outcomes',
        data: analyticsData?.treatmentOutcomes.map(item => item.count) || [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for revenue chart
  const revenueData = {
    labels: analyticsData?.revenueByMonth.map(item => `${getMonthName(item.month)} ${item.year}`) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: analyticsData?.revenueByMonth.map(item => item.revenue) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate a PDF or Excel report
    // For now, we'll just show a toast
    toast({
      title: "Export Started",
      description: "Your analytics report is being generated",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                View insights about your patients, treatments, and revenue
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={dateRange}
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last3months">Last 3 Months</SelectItem>
                  <SelectItem value="last6months">Last 6 Months</SelectItem>
                  <SelectItem value="lastyear">Last Year</SelectItem>
                  <SelectItem value="alltime">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Count Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <LineChart className="h-4 w-4 mr-2 text-muted-foreground" />
                    <CardTitle className="text-base">Patient Count Over Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line 
                      data={patientCountData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Common Procedures Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                    <CardTitle className="text-base">Common Procedures</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <Pie 
                      data={commonProceduresData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Treatment Outcomes Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                    <CardTitle className="text-base">Treatment Outcomes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <Pie 
                      data={treatmentOutcomesData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <CardTitle className="text-base">Revenue by Month</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Bar 
                      data={revenueData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Key Metrics Summary */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Key Metrics Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-md p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Patients</p>
                      <p className="text-2xl font-bold">
                        {analyticsData?.patientCountByMonth.reduce((sum, item) => sum + item.count, 0) || 0}
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Procedures</p>
                      <p className="text-2xl font-bold">
                        {analyticsData?.commonProcedures.reduce((sum, item) => sum + item.count, 0) || 0}
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {analyticsData?.treatmentOutcomes.length ? 
                          Math.round(
                            (analyticsData.treatmentOutcomes.find(item => item._id === "Completed")?.count || 0) / 
                            analyticsData.treatmentOutcomes.reduce((sum, item) => sum + item.count, 0) * 100
                          ) + "%" : 
                          "0%"
                        }
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ${analyticsData?.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0).toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
