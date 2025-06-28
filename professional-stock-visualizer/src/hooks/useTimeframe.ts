import { useState, useCallback, useEffect } from 'react';
import type { Timeframe } from '../types/chart';
import { getStartDateForTimeframe, isMarketOpen, getMarketStatus } from '../utils/timeframeUtils';

interface UseTimeframeProps {
  initialTimeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

interface UseTimeframeReturn {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  timeframeOptions: Array<{
    value: Timeframe;
    label: string;
    description: string;
    shortLabel: string;
  }>;
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
  isRealTime: boolean;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

export const useTimeframe = ({
  initialTimeframe = '1Y',
  onTimeframeChange
}: UseTimeframeProps = {}): UseTimeframeReturn => {
  const [timeframe, setTimeframeState] = useState<Timeframe>(initialTimeframe);
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre-market' | 'after-hours'>('closed');

  // Timeframe options configuration
  const timeframeOptions = [
    {
      value: '1D' as Timeframe,
      label: '1 Day',
      description: 'Intraday view with minute-level data',
      shortLabel: '1D'
    },
    {
      value: '5D' as Timeframe,
      label: '5 Days',
      description: 'Week view with hourly data',
      shortLabel: '5D'
    },
    {
      value: '1M' as Timeframe,
      label: '1 Month',
      description: 'Monthly view with daily data',
      shortLabel: '1M'
    },
    {
      value: '3M' as Timeframe,
      label: '3 Months',
      description: 'Quarterly view with daily data',
      shortLabel: '3M'
    },
    {
      value: '6M' as Timeframe,
      label: '6 Months',
      description: 'Semi-annual view with daily data',
      shortLabel: '6M'
    },
    {
      value: '1Y' as Timeframe,
      label: '1 Year',
      description: 'Annual view with daily data',
      shortLabel: '1Y'
    },
    {
      value: '2Y' as Timeframe,
      label: '2 Years',
      description: 'Bi-annual view with weekly data',
      shortLabel: '2Y'
    },
    {
      value: '5Y' as Timeframe,
      label: '5 Years',
      description: 'Long-term view with weekly data',
      shortLabel: '5Y'
    },
    {
      value: 'MAX' as Timeframe,
      label: 'Maximum',
      description: 'All available data with monthly aggregation',
      shortLabel: 'MAX'
    }
  ];

  // Calculate date range for current timeframe
  const dateRange = {
    start: getStartDateForTimeframe(timeframe),
    end: new Date(),
    label: getDateRangeLabel(timeframe)
  };

  // Determine if current timeframe shows real-time data
  const isRealTime = timeframe === '1D' || timeframe === '5D';

  // Handle timeframe changes
  const setTimeframe = useCallback((newTimeframe: Timeframe) => {
    setTimeframeState(newTimeframe);
    onTimeframeChange?.(newTimeframe);
  }, [onTimeframeChange]);

  // Update market status periodically
  useEffect(() => {
    const updateMarketStatus = () => {
      setMarketStatus(getMarketStatus());
    };

    // Update immediately
    updateMarketStatus();

    // Update every minute
    const interval = setInterval(updateMarketStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    timeframe,
    setTimeframe,
    timeframeOptions,
    dateRange,
    isRealTime,
    marketStatus
  };
};

// Helper function to get date range label
const getDateRangeLabel = (timeframe: Timeframe): string => {
  const end = new Date();
  const start = getStartDateForTimeframe(timeframe);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: timeframe === '2Y' || timeframe === '5Y' || timeframe === 'MAX' ? 'numeric' : undefined
  };

  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
};

// Custom hook for keyboard shortcuts
export const useTimeframeShortcuts = (
  currentTimeframe: Timeframe,
  setTimeframe: (timeframe: Timeframe) => void
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for Alt/Option key modifier
      if (!event.altKey) return;

      switch (event.key) {
        case '1':
          event.preventDefault();
          setTimeframe('1D');
          break;
        case '5':
          event.preventDefault();
          setTimeframe('5D');
          break;
        case 'm':
          event.preventDefault();
          setTimeframe('1M');
          break;
        case 'q':  // Quarter
          event.preventDefault();
          setTimeframe('3M');
          break;
        case 'y':
          event.preventDefault();
          setTimeframe('1Y');
          break;
        case 'M':  // Max
          event.preventDefault();
          setTimeframe('MAX');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [setTimeframe]);
};

// Custom hook for timeframe presets
export const useTimeframePresets = () => {
  const presets = [
    {
      name: 'Day Trading',
      timeframes: ['1D', '5D'] as Timeframe[],
      description: 'Short-term intraday analysis'
    },
    {
      name: 'Swing Trading',
      timeframes: ['5D', '1M', '3M'] as Timeframe[],
      description: 'Medium-term trend analysis'
    },
    {
      name: 'Position Trading',
      timeframes: ['3M', '6M', '1Y'] as Timeframe[],
      description: 'Long-term position analysis'
    },
    {
      name: 'Investment Analysis',
      timeframes: ['1Y', '2Y', '5Y', 'MAX'] as Timeframe[],
      description: 'Long-term investment research'
    }
  ];

  return { presets };
};

// Custom hook for timeframe comparison
export const useTimeframeComparison = () => {
  const [compareMode, setCompareMode] = useState(false);
  const [compareTimeframes, setCompareTimeframes] = useState<Timeframe[]>([]);

  const addCompareTimeframe = useCallback((timeframe: Timeframe) => {
    setCompareTimeframes(prev => {
      if (prev.includes(timeframe)) return prev;
      return [...prev, timeframe].slice(0, 3); // Max 3 comparisons
    });
  }, []);

  const removeCompareTimeframe = useCallback((timeframe: Timeframe) => {
    setCompareTimeframes(prev => prev.filter(tf => tf !== timeframe));
  }, []);

  const clearComparisons = useCallback(() => {
    setCompareTimeframes([]);
    setCompareMode(false);
  }, []);

  return {
    compareMode,
    setCompareMode,
    compareTimeframes,
    addCompareTimeframe,
    removeCompareTimeframe,
    clearComparisons
  };
};