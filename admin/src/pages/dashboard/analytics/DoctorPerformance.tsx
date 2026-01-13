import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DoctorPerformanceProps {
  dateRange: any;
  period: string;
}

const DoctorPerformance: React.FC<DoctorPerformanceProps> = ({ dateRange, period }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Doctor performance analytics will be displayed here.</p>
          <p>Date Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}</p>
          <p>Period: {period}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorPerformance;