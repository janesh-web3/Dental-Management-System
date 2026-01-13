import React, { Suspense, lazy } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load analytics components - using absolute paths
const AppointmentAnalytics = lazy(() => import('../../pages/dashboard/analytics/AppointmentAnalytics'));
const RevenueAnalytics = lazy(() => import('../../pages/dashboard/analytics/RevenueAnalytics'));
const DoctorPerformance = lazy(() => import('../../pages/dashboard/analytics/DoctorPerformance'));
const PatientInsights = lazy(() => import('../../pages/dashboard/analytics/PatientInsights'));

// Loading skeleton for analytics
const AnalyticsLoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  </div>
);

interface LazyAnalyticsTabProps {
  activeTab: string;
  dateRange: any;
  period: string;
}

export const LazyAnalyticsTab: React.FC<LazyAnalyticsTabProps> = ({
  activeTab,
  dateRange,
  period
}) => {
  const renderAnalyticsComponent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <AppointmentAnalytics dateRange={dateRange} period={period} />
          </Suspense>
        );
      case 'revenue':
        return (
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <RevenueAnalytics dateRange={dateRange} period={period} />
          </Suspense>
        );
      case 'doctors':
        return (
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <DoctorPerformance dateRange={dateRange} period={period} />
          </Suspense>
        );
      case 'patients':
        return (
          <Suspense fallback={<AnalyticsLoadingSkeleton />}>
            <PatientInsights dateRange={dateRange} period={period} />
          </Suspense>
        );
      default:
        return <AnalyticsLoadingSkeleton />;
    }
  };

  return (
    <div className="min-h-[400px]">
      {renderAnalyticsComponent()}
    </div>
  );
};