import type { ChartDataPoint, ProcessedChartData, Timeframe, VolumeProfileData, SupportResistanceLevel } from '../types/chart';
import type { PriceData } from '../types/stock';

// Convert PriceData to ChartDataPoint format
export const convertToChartData = (priceData: PriceData[]): ChartDataPoint[] => {
  return priceData.map(price => ({
    ...price,
    timestamp: new Date(price.time).getTime(),
  }));
};

// Filter data based on timeframe
export const filterDataByTimeframe = (
  data: ChartDataPoint[], 
  timeframe: Timeframe
): ProcessedChartData => {
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case '1D':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '5D':
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      break;
    case '1M':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3M':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6M':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1Y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '2Y':
      startDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '5Y':
      startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    case 'MAX':
    default:
      startDate = new Date(0); // Unix epoch
      break;
  }
  
  const filteredData = data.filter(point => 
    new Date(point.time).getTime() >= startDate.getTime()
  );
  
  return {
    data: filteredData,
    timeframe,
    startDate: filteredData[0]?.time || '',
    endDate: filteredData[filteredData.length - 1]?.time || '',
    totalPoints: filteredData.length,
  };
};

// Calculate volume profile data
export const calculateVolumeProfile = (
  data: ChartDataPoint[], 
  bins: number = 50
): VolumeProfileData[] => {
  if (data.length === 0) return [];
  
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const binSize = priceRange / bins;
  
  // Initialize volume profile bins
  const volumeProfile: { [key: number]: number } = {};
  
  // Distribute volume across price levels
  data.forEach(point => {
    const binIndex = Math.floor((point.close - minPrice) / binSize);
    const price = minPrice + (binIndex * binSize) + (binSize / 2);
    volumeProfile[price] = (volumeProfile[price] || 0) + point.volume;
  });
  
  // Convert to array and calculate percentages
  const totalVolume = Object.values(volumeProfile).reduce((sum, vol) => sum + vol, 0);
  const profileData: VolumeProfileData[] = Object.entries(volumeProfile)
    .map(([price, volume]) => ({
      price: parseFloat(price),
      volume,
      percentage: (volume / totalVolume) * 100,
    }))
    .sort((a, b) => a.price - b.price);
  
  // Find Point of Control (POC) - price level with highest volume
  const pocIndex = profileData.reduce((maxIndex, current, index) => 
    current.volume > profileData[maxIndex].volume ? index : maxIndex, 0
  );
  
  profileData[pocIndex].pocLevel = true;
  
  // Calculate Value Area (70% of volume around POC)
  const sortedByVolume = [...profileData].sort((a, b) => b.volume - a.volume);
  let valueAreaVolume = 0;
  const valueAreaThreshold = totalVolume * 0.7;
  
  for (let i = 0; i < sortedByVolume.length && valueAreaVolume < valueAreaThreshold; i++) {
    valueAreaVolume += sortedByVolume[i].volume;
    const originalIndex = profileData.findIndex(p => p.price === sortedByVolume[i].price);
    if (i === 0) {
      profileData[originalIndex].valueAreaHigh = true;
    }
  }
  
  return profileData;
};

// Detect support and resistance levels
export const detectSupportResistance = (
  data: ChartDataPoint[], 
  sensitivity: number = 0.02,
  minTouches: number = 2
): SupportResistanceLevel[] => {
  if (data.length < 20) return [];
  
  const levels: SupportResistanceLevel[] = [];
  const tolerance = sensitivity; // 2% tolerance by default
  
  // Find local peaks and troughs
  const peaks: Array<{ price: number; time: string; index: number }> = [];
  const troughs: Array<{ price: number; time: string; index: number }> = [];
  
  for (let i = 2; i < data.length - 2; i++) {
    const current = data[i];
    const prev2 = data[i - 2];
    const prev1 = data[i - 1];
    const next1 = data[i + 1];
    const next2 = data[i + 2];
    
    // Peak detection
    if (current.high > prev2.high && current.high > prev1.high && 
        current.high > next1.high && current.high > next2.high) {
      peaks.push({ price: current.high, time: current.time, index: i });
    }
    
    // Trough detection
    if (current.low < prev2.low && current.low < prev1.low && 
        current.low < next1.low && current.low < next2.low) {
      troughs.push({ price: current.low, time: current.time, index: i });
    }
  }
  
  // Group similar price levels for resistance
  const resistanceLevels = groupSimilarLevels(peaks, tolerance, minTouches, 'resistance');
  const supportLevels = groupSimilarLevels(troughs, tolerance, minTouches, 'support');
  
  return [...resistanceLevels, ...supportLevels];
};

// Helper function to group similar price levels
const groupSimilarLevels = (
  points: Array<{ price: number; time: string; index: number }>,
  tolerance: number,
  minTouches: number,
  type: 'support' | 'resistance'
): SupportResistanceLevel[] => {
  const levels: SupportResistanceLevel[] = [];
  const used: boolean[] = new Array(points.length).fill(false);
  
  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue;
    
    const currentPrice = points[i].price;
    const group = [points[i]];
    used[i] = true;
    
    // Find similar price levels
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue;
      
      const diff = Math.abs(points[j].price - currentPrice) / currentPrice;
      if (diff <= tolerance) {
        group.push(points[j]);
        used[j] = true;
      }
    }
    
    // Only create level if it has minimum touches
    if (group.length >= minTouches) {
      const avgPrice = group.reduce((sum, p) => sum + p.price, 0) / group.length;
      const strength = Math.min(group.length / 5, 1); // Normalize to 0-1
      const lastTouch = group[group.length - 1].time;
      
      levels.push({
        id: `${type}-${avgPrice.toFixed(2)}-${Date.now()}`,
        price: avgPrice,
        strength,
        type,
        touches: group.length,
        lastTouch,
        confidence: calculateLevelConfidence(group, type),
      });
    }
  }
  
  return levels.sort((a, b) => b.strength - a.strength);
};

// Calculate confidence score for support/resistance level
const calculateLevelConfidence = (
  group: Array<{ price: number; time: string; index: number }>,
  type: 'support' | 'resistance'
): number => {
  let confidence = 0;
  
  // More touches = higher confidence
  confidence += Math.min(group.length * 0.2, 0.6);
  
  // Recent touches = higher confidence
  const now = Date.now();
  const recentTouches = group.filter(point => 
    (now - new Date(point.time).getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 days
  );
  confidence += (recentTouches.length / group.length) * 0.2;
  
  // Price clustering = higher confidence
  const prices = group.map(p => p.price);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
  const coeffOfVariation = Math.sqrt(variance) / avgPrice;
  confidence += Math.max(0, (0.05 - coeffOfVariation) * 4); // Lower variance = higher confidence
  
  return Math.min(confidence, 1);
};

// Calculate price change percentage
export const calculatePriceChange = (current: number, previous: number): number => {
  return ((current - previous) / previous) * 100;
};

// Format price for display
export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

// Format volume for display
export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`;
  }
  return volume.toString();
};

// Calculate OHLC from intraday data (for different timeframes)
export const aggregateOHLC = (
  data: ChartDataPoint[], 
  intervalMinutes: number
): ChartDataPoint[] => {
  if (data.length === 0) return [];
  
  const aggregated: ChartDataPoint[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;
  
  let currentInterval = Math.floor(data[0].timestamp / intervalMs) * intervalMs;
  let intervalData: ChartDataPoint[] = [];
  
  for (const point of data) {
    const pointInterval = Math.floor(point.timestamp / intervalMs) * intervalMs;
    
    if (pointInterval === currentInterval) {
      intervalData.push(point);
    } else {
      // Process completed interval
      if (intervalData.length > 0) {
        aggregated.push(createOHLCFromPoints(intervalData, currentInterval));
      }
      
      // Start new interval
      currentInterval = pointInterval;
      intervalData = [point];
    }
  }
  
  // Process final interval
  if (intervalData.length > 0) {
    aggregated.push(createOHLCFromPoints(intervalData, currentInterval));
  }
  
  return aggregated;
};

// Helper function to create OHLC from array of points
const createOHLCFromPoints = (points: ChartDataPoint[], timestamp: number): ChartDataPoint => {
  const open = points[0].open;
  const close = points[points.length - 1].close;
  const high = Math.max(...points.map(p => p.high));
  const low = Math.min(...points.map(p => p.low));
  const volume = points.reduce((sum, p) => sum + p.volume, 0);
  
  return {
    time: new Date(timestamp).toISOString(),
    timestamp,
    open,
    high,
    low,
    close,
    volume,
  };
};

// Calculate Average True Range (ATR) for volatility
export const calculateATR = (data: ChartDataPoint[], period: number = 14): number[] => {
  if (data.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  
  // Calculate True Range for each period
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate ATR using simple moving average
  const atr: number[] = [];
  for (let i = period - 1; i < trueRanges.length; i++) {
    const avgTR = trueRanges.slice(i - period + 1, i + 1).reduce((sum, tr) => sum + tr, 0) / period;
    atr.push(avgTR);
  }
  
  return atr;
};

// Detect chart patterns (basic implementation)
export const detectChartPatterns = (data: ChartDataPoint[]): any[] => {
  // Placeholder for pattern detection algorithms
  // This would include complex algorithms for detecting:
  // - Triangles, channels, flags, pennants
  // - Head and shoulders, double tops/bottoms
  // - Cup and handle patterns
  // Implementation would be quite extensive, so returning empty array for now
  return [];
};

// Generate realistic price levels for demo
export const generatePriceLevels = (currentPrice: number, count: number = 5): number[] => {
  const levels: number[] = [];
  const baseSpacing = currentPrice * 0.05; // 5% spacing
  
  for (let i = 1; i <= count; i++) {
    // Support levels (below current price)
    levels.push(currentPrice - (baseSpacing * i * (0.8 + Math.random() * 0.4)));
    // Resistance levels (above current price)
    levels.push(currentPrice + (baseSpacing * i * (0.8 + Math.random() * 0.4)));
  }
  
  return levels.sort((a, b) => a - b);
};