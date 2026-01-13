import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

// Performance metrics storage
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100; // Keep only last 100 metrics

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  // Start timing on component mount/update
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  // Record mount time
  useEffect(() => {
    mountTime.current = performance.now();
    return () => {
      // Component unmount - could track unmount time if needed
    };
  }, []);

  // Measure render performance
  const measureRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    const metric: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now()
    };

    performanceMetrics.push(metric);
    
    // Keep only recent metrics
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  // Measure render time after each render
  useEffect(() => {
    measureRender();
  });

  return {
    getMetrics: () => performanceMetrics.filter(m => m.componentName === componentName),
    getAllMetrics: () => performanceMetrics,
    clearMetrics: () => {
      const index = performanceMetrics.findIndex(m => m.componentName === componentName);
      if (index > -1) {
        performanceMetrics.splice(index, 1);
      }
    }
  };
};

// Hook for measuring API call performance
export const useApiPerformance = () => {
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${operationName}: ${duration.toFixed(2)}ms`);
        
        if (duration > 1000) {
          console.warn(`Slow API call detected: ${operationName} took ${duration.toFixed(2)}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { measureApiCall };
};

// Hook for debouncing expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling expensive operations
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]) as T;
};