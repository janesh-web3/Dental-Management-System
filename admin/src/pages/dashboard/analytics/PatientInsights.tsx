import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PatientInsightsProps {
  dateRange: any;
  period: string;
}

const PatientInsights: React.FC<PatientInsightsProps> = ({ dateRange, period }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Patient insights will be displayed here.</p>
          <p>Date Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}</p>
          <p>Period: {period}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientInsights;