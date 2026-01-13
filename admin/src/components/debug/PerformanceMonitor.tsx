import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold?: number;
}

interface ApiMetric {
  endpoint: string;
  averageTime: number;
  callCount: number;
  errorRate: number;
  lastCalled: string;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Collect performance metrics
  useEffect(() => {
    if (!isVisible) return;

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Page Load Time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          status: navigation.loadEventEnd - navigation.fetchStart > 3000 ? 'critical' : 
                  navigation.loadEventEnd - navigation.fetchStart > 1500 ? 'warning' : 'good',
          threshold: 1500
        },
        {
          name: 'DOM Content Loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms',
          status: navigation.domContentLoadedEventEnd - navigation.fetchStart > 1000 ? 'warning' : 'good',
          threshold: 1000
        },
        {
          name: 'First Paint',
          value: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          unit: 'ms',
          status: (performance.getEntriesByName('first-paint')[0]?.startTime || 0) > 1000 ? 'warning' : 'good',
          threshold: 1000
        }
      ];

      if (memory) {
        newMetrics.push(
          {
            name: 'Used JS Heap',
            value: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            unit: 'MB',
            status: memory.usedJSHeapSize / memory.totalJSHeapSize > 0.8 ? 'critical' : 
                    memory.usedJSHeapSize / memory.totalJSHeapSize > 0.6 ? 'warning' : 'good',
            threshold: Math.round(memory.totalJSHeapSize * 0.6 / 1024 / 1024)
          },
          {
            name: 'Total JS Heap',
            value: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            unit: 'MB',
            status: 'good'
          }
        );
      }

      setMetrics(newMetrics);
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  // Collect API performance metrics
  useEffect(() => {
    if (!isVisible) return;

    const collectApiMetrics = () => {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const apiCalls = resourceEntries.filter(entry => 
        entry.name.includes('/api/') && entry.responseEnd > 0
      );

      const apiMetricsMap = new Map<string, { times: number[], errors: number, lastCalled: number }>();

      apiCalls.forEach(call => {
        const endpoint = new URL(call.name).pathname;
        const duration = call.responseEnd - call.requestStart;
        const isError = call.responseStart === 0; // No response means error

        if (!apiMetricsMap.has(endpoint)) {
          apiMetricsMap.set(endpoint, { times: [], errors: 0, lastCalled: 0 });
        }

        const metric = apiMetricsMap.get(endpoint)!;
        metric.times.push(duration);
        if (isError) metric.errors++;
        metric.lastCalled = Math.max(metric.lastCalled, call.responseEnd);
      });

      const newApiMetrics: ApiMetric[] = Array.from(apiMetricsMap.entries()).map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.times.reduce((a, b) => a + b, 0) / data.times.length,
        callCount: data.times.length,
        errorRate: (data.errors / data.times.length) * 100,
        lastCalled: new Date(performance.timeOrigin + data.lastCalled).toLocaleTimeString()
      }));

      setApiMetrics(newApiMetrics.sort((a, b) => b.callCount - a.callCount).slice(0, 10));
    };

    collectApiMetrics();
    const interval = setInterval(collectApiMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 overflow-hidden shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Performance Monitor</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-3">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API Calls</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-2 max-h-64 overflow-y-auto">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-xs font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono">
                      {metric.value.toFixed(0)} {metric.unit}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="api" className="space-y-2 max-h-64 overflow-y-auto">
              {apiMetrics.map((api, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate" title={api.endpoint}>
                      {api.endpoint}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {api.callCount} calls
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Avg: {api.averageTime.toFixed(0)}ms</span>
                    <span>Errors: {api.errorRate.toFixed(1)}%</span>
                    <span>Last: {api.lastCalled}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to toggle performance monitor
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(prev => !prev);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return { isVisible, toggle, show, hide };
};