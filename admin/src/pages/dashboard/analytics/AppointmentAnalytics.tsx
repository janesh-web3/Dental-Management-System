import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppointmentAnalyticsProps {
  dateRange: any;
  period: string;
}

const AppointmentAnalytics: React.FC<AppointmentAnalyticsProps> = ({ dateRange, period }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Appointment analytics will be displayed here.</p>
          <p>Date Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}</p>
          <p>Period: {period}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAnalytics;