import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChartDataPoint, ProcessedChartData, Timeframe, ChartSettings } from '../types/chart';
import type { PriceData } from '../types/stock';
import { 
  convertToChartData, 
  filterDataByTimeframe, 
  aggregateOHLC 
} from '../utils/chartHelpers';
import { getIntervalForTimeframe, getStartDateForTimeframe } from '../utils/timeframeUtils';
import { generateMockStockData } from '../utils/mockData';

interface UseChartDataProps {
  symbol: string;
  initialTimeframe?: Timeframe;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface UseChartDataReturn {
  chartData: ProcessedChartData | null;
  rawData: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
  dataQuality: {
    totalPoints: number;
    missingPoints: number;
    dataCompleteness: number; // 0-1
  };
}

export const useChartData = ({
  symbol,
  initialTimeframe = '1Y',
  autoRefresh = false,
  refreshInterval = 60
}: UseChartDataProps): UseChartDataReturn => {
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Process chart data based on timeframe
  const chartData = useMemo((): ProcessedChartData | null => {
    if (rawData.length === 0) return null;
    
    try {
      const filtered = filterDataByTimeframe(rawData, timeframe);
      
      // Aggregate data if needed for performance
      if (filtered.data.length > 1000 && timeframe !== '1D' && timeframe !== '5D') {
        const intervalMinutes = getAggregationInterval(timeframe);
        const aggregated = aggregateOHLC(filtered.data, intervalMinutes);
        
        return {
          ...filtered,
          data: aggregated,
          totalPoints: aggregated.length
        };
      }
      
      return filtered;
    } catch (err) {
      console.error('Error processing chart data:', err);
      setError('Failed to process chart data');
      return null;
    }
  }, [rawData, timeframe]);

  // Calculate data quality metrics
  const dataQuality = useMemo(() => {
    if (!chartData || chartData.data.length === 0) {
      return {
        totalPoints: 0,
        missingPoints: 0,
        dataCompleteness: 0
      };
    }

    const data = chartData.data;
    const totalPoints = data.length;
    
    // Count missing or invalid data points
    const missingPoints = data.filter(point => 
      point.close === null || 
      point.close === undefined || 
      point.volume === null ||
      point.volume === undefined ||
      isNaN(point.close) ||
      isNaN(point.volume)
    ).length;
    
    const dataCompleteness = totalPoints > 0 ? (totalPoints - missingPoints) / totalPoints : 0;
    
    return {
      totalPoints,
      missingPoints,
      dataCompleteness
    };
  }, [chartData]);

  // Fetch chart data
  const fetchChartData = useCallback(async (targetSymbol: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data generation
      const stockData = generateMockStockData(targetSymbol);
      const convertedData = convertToChartData(stockData.prices);
      
      setRawData(convertedData);
      setLastUpdated(new Date());
      
      // Simulate network delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chart data';
      setError(errorMessage);
      console.error('Chart data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data function
  const refreshData = useCallback(async () => {
    if (!symbol) return;
    await fetchChartData(symbol);
  }, [symbol, fetchChartData]);

  // Load data when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchChartData(symbol);
    }
  }, [symbol, fetchChartData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !symbol) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, symbol, refreshData]);

  // Update timeframe and clear any errors
  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    setError(null);
  }, []);

  return {
    chartData,
    rawData,
    isLoading,
    error,
    timeframe,
    setTimeframe: handleTimeframeChange,
    refreshData,
    lastUpdated,
    dataQuality
  };
};

// Helper function to determine aggregation interval based on timeframe
const getAggregationInterval = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case '1M':
      return 60;      // 1 hour
    case '3M':
      return 240;     // 4 hours
    case '6M':
      return 1440;    // 1 day
    case '1Y':
      return 1440;    // 1 day
    case '2Y':
      return 10080;   // 1 week
    case '5Y':
    case 'MAX':
      return 43200;   // 1 month (30 days)
    default:
      return 60;      // Default to 1 hour
  }
};

// Custom hook for real-time price updates
export const useRealTimePrice = (symbol: string, enabled: boolean = true) => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{
    absolute: number;
    percentage: number;
  } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) return;

    // Simulate real-time price updates
    const interval = setInterval(() => {
      // Generate realistic price movement
      const basePrice = currentPrice || 100;
      const volatility = 0.002; // 0.2% volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = basePrice * (1 + randomChange);
      
      const change = newPrice - basePrice;
      const changePercentage = (change / basePrice) * 100;
      
      setCurrentPrice(newPrice);
      setPriceChange({
        absolute: change,
        percentage: changePercentage
      });
      setLastUpdate(new Date());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [symbol, enabled, currentPrice]);

  return {
    currentPrice,
    priceChange,
    lastUpdate
  };
};

// Custom hook for chart performance optimization
export const useChartPerformance = (dataLength: number) => {
  const [performanceMode, setPerformanceMode] = useState<'full' | 'optimized'>('full');
  
  useEffect(() => {
    // Switch to optimized mode for large datasets
    if (dataLength > 2000) {
      setPerformanceMode('optimized');
    } else {
      setPerformanceMode('full');
    }
  }, [dataLength]);

  const shouldDecimateData = performanceMode === 'optimized';
  const maxDataPoints = shouldDecimateData ? 1000 : dataLength;
  
  // Calculate decimation factor
  const decimationFactor = shouldDecimateData 
    ? Math.ceil(dataLength / maxDataPoints) 
    : 1;

  return {
    performanceMode,
    shouldDecimateData,
    maxDataPoints,
    decimationFactor,
    setPerformanceMode
  };
};

// Custom hook for chart data caching
export const useChartCache = () => {
  const [cache, setCache] = useState<Map<string, {
    data: ChartDataPoint[];
    timestamp: number;
    expiry: number;
  }>>(new Map());

  const getCachedData = useCallback((key: string): ChartDataPoint[] | null => {
    const cached = cache.get(key);
    if (!cached) return null;
    
    // Check if data is expired (5 minutes cache)
    if (Date.now() > cached.expiry) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return cached.data;
  }, [cache]);

  const setCachedData = useCallback((key: string, data: ChartDataPoint[]) => {
    const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    setCache(prev => new Map(prev).set(key, {
      data,
      timestamp: Date.now(),
      expiry
    }));
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const getCacheStats = useCallback(() => {
    const entries = Array.from(cache.entries());
    const expired = entries.filter(([, value]) => Date.now() > value.expiry).length;
    
    return {
      totalEntries: cache.size,
      expiredEntries: expired,
      memoryUsage: entries.reduce((acc, [, value]) => acc + value.data.length, 0)
    };
  }, [cache]);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    getCacheStats
  };
};