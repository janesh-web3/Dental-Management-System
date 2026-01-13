import { useState, useEffect, useCallback, useRef } from 'react';
import { crudRequest, clearApiCache } from '@/lib/api';
import { useApiPerformance } from './usePerformanceMonitor';

interface FetchOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export const useOptimizedFetch = <T>(
  url: string,
  options: FetchOptions = {}
) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const { measureApiCall } = useApiPerformance();

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check if data is still fresh
    if (!force && state.data && state.lastFetched) {
      const age = Date.now() - state.lastFetched;
      if (age < staleTime) {
        return state.data;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await measureApiCall(
        () => crudRequest<T>('GET', url, undefined, {
          signal: abortControllerRef.current?.signal,
          useCache: !force,
          cacheDuration: cacheTime
        }),
        `fetch-${url}`
      );

      setState({
        data,
        loading: false,
        error: null,
        lastFetched: Date.now()
      });

      retryCountRef.current = 0;
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }

      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(force);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An error occurred'
      }));
    }
  }, [url, enabled, staleTime, cacheTime, retry, retryDelay, measureApiCall]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (state.lastFetched) {
        const age = Date.now() - state.lastFetched;
        if (age > staleTime) {
          fetchData();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, staleTime, fetchData, state.lastFetched]);

  const refetch = useCallback(() => {
    clearApiCache(url);
    return fetchData(true);
  }, [fetchData, url]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof newData === 'function' 
        ? (newData as (prev: T | null) => T)(prev.data)
        : newData,
      lastFetched: Date.now()
    }));
  }, []);

  return {
    ...state,
    refetch,
    mutate,
    isStale: state.lastFetched ? (Date.now() - state.lastFetched) > staleTime : false
  };
};

// Hook for paginated data fetching
export const usePaginatedFetch = <T>(
  baseUrl: string,
  pageSize = 20,
  options: FetchOptions = {}
) => {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
  
  const { data, loading, error, refetch } = useOptimizedFetch<{
    data: T[];
    total: number;
    page: number;
    pages: number;
  }>(url, options);

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllData(data.data);
      } else {
        setAllData(prev => [...prev, ...data.data]);
      }
      setHasMore(page < data.pages);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    page,
    total: data?.total || 0
  };
};

// Hook for infinite scroll
export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) => {
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) { // 1000px before bottom
        callback();
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledHandleScroll);
    
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [callback, hasMore, loading]);
};

// Throttle utility
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  
  return function (...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};