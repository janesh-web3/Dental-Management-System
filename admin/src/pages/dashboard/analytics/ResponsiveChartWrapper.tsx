import React, { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

interface ResponsiveChartWrapperProps {
  children: ReactNode;
  height?: number | string;
  smallScreenHeight?: number | string;
  width?: number | string;
  className?: string;
}

/**
 * A wrapper component that provides responsive sizing for charts
 * Uses different heights for mobile and desktop screens
 */
export function ResponsiveChartWrapper({
  children,
  height = 400,
  smallScreenHeight = 300,
  width = '100%',
  className = '',
}: ResponsiveChartWrapperProps) {
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const actualHeight = isSmallScreen ? smallScreenHeight : height;

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width={width} height={actualHeight}>
        {React.isValidElement(children) ? children : <></>}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A component for displaying responsive legends for charts
 * Adjusts layout based on screen size
 */
export function ResponsiveLegend({ 
  items 
}: { 
  items: Array<{ name: string; color: string }> 
}) {
  const isSmallScreen = useMediaQuery('(max-width: 640px)');

  return (
    <div className={`flex ${isSmallScreen ? 'flex-wrap justify-center' : 'flex-row justify-end'} gap-2 mt-2 mb-4`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <div 
            className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm mr-1" 
            style={{ backgroundColor: item.color }} 
          />
          <span className="text-xs sm:text-sm">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Utility component for displaying a "No data available" message in chart areas
 */
export function NoDataDisplay({ message = "No data available for the selected time period" }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 sm:h-64 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      <svg 
        className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mb-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      </svg>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center px-4">
        {message}
      </p>
    </div>
  );
}
