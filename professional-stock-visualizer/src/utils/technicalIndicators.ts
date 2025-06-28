import type { ChartDataPoint } from '../types/chart';


// Simple Moving Average
export const calculateSMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      result.push(sum / period);
    }
  }
  
  return result;
};

// Exponential Moving Average
export const calculateEMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else if (i < period - 1) {
      // Use SMA for initial values
      const sum = data.slice(0, i + 1).reduce((acc, val) => acc + val, 0);
      result.push(sum / (i + 1));
    } else {
      const prevEMA = result[i - 1];
      if (prevEMA !== null) {
        result.push((data[i] * multiplier) + (prevEMA * (1 - multiplier)));
      } else {
        result.push(null);
      }
    }
  }
  
  return result;
};

// Weighted Moving Average
export const calculateWMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const subset = data.slice(i - period + 1, i + 1);
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let j = 0; j < subset.length; j++) {
        const weight = j + 1;
        weightedSum += subset[j] * weight;
        weightSum += weight;
      }
      
      result.push(weightedSum / weightSum);
    }
  }
  
  return result;
};

// Bollinger Bands
export const calculateBollingerBands = (
  data: number[], 
  period: number = 20, 
  stdDev: number = 2
): Array<{ upper: number | null; middle: number | null; lower: number | null }> => {
  const sma = calculateSMA(data, period);
  const result: Array<{ upper: number | null; middle: number | null; lower: number | null }> = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ upper: null, middle: null, lower: null });
    } else {
      const middle = sma[i];
      if (middle !== null) {
        const subset = data.slice(i - period + 1, i + 1);
        const variance = subset.reduce((acc, val) => acc + Math.pow(val - middle, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        result.push({
          upper: middle + (standardDeviation * stdDev),
          middle: middle,
          lower: middle - (standardDeviation * stdDev),
        });
      } else {
        result.push({ upper: null, middle: null, lower: null });
      }
    }
  }
  
  return result;
};

// Relative Strength Index (RSI)
export const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  
  if (data.length < period + 1) {
    return data.map(() => null);
  }
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  // Separate gains and losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
  
  // Add null values for insufficient data
  for (let i = 0; i <= period; i++) {
    result.push(null);
  }
  
  // Calculate RSI for remaining periods
  for (let i = period; i < changes.length; i++) {
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
    
    // Update averages using Wilder's smoothing
    if (i < changes.length - 1) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
  }
  
  return result;
};

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (
  data: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): Array<{ macd: number | null; signal: number | null; histogram: number | null }> => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    } else {
      macdLine.push(null);
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const validMacdValues = macdLine.filter(val => val !== null) as number[];
  const signalLine = calculateEMA(validMacdValues, signalPeriod);
  
  // Align signal line with original data length
  const alignedSignalLine: (number | null)[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      alignedSignalLine.push(signalLine[signalIndex] || null);
      signalIndex++;
    } else {
      alignedSignalLine.push(null);
    }
  }
  
  // Calculate histogram
  const result: Array<{ macd: number | null; signal: number | null; histogram: number | null }> = [];
  for (let i = 0; i < data.length; i++) {
    const macd = macdLine[i];
    const signal = alignedSignalLine[i];
    const histogram = (macd !== null && signal !== null) ? macd - signal : null;
    
    result.push({ macd, signal, histogram });
  }
  
  return result;
};

// Stochastic Oscillator
export const calculateStochastic = (
  data: ChartDataPoint[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): Array<{ k: number | null; d: number | null }> => {
  const result: Array<{ k: number | null; d: number | null }> = [];
  
  // Calculate %K
  const kValues: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
    } else {
      const subset = data.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...subset.map(d => d.high));
      const lowestLow = Math.min(...subset.map(d => d.low));
      const currentClose = data[i].close;
      
      if (highestHigh === lowestLow) {
        kValues.push(50); // Avoid division by zero
      } else {
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      }
    }
  }
  
  // Calculate %D (SMA of %K)
  const validKValues = kValues.filter(val => val !== null) as number[];
  const dValues = calculateSMA(validKValues, dPeriod);
  
  // Align %D values with original data length
  let dIndex = 0;
  for (let i = 0; i < data.length; i++) {
    const k = kValues[i];
    let d: number | null = null;
    
    if (k !== null) {
      d = dValues[dIndex] || null;
      dIndex++;
    }
    
    result.push({ k, d });
  }
  
  return result;
};

// Williams %R
export const calculateWilliamsR = (
  data: ChartDataPoint[], 
  period: number = 14
): (number | null)[] => {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const subset = data.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...subset.map(d => d.high));
      const lowestLow = Math.min(...subset.map(d => d.low));
      const currentClose = data[i].close;
      
      if (highestHigh === lowestLow) {
        result.push(-50); // Avoid division by zero
      } else {
        const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
        result.push(williamsR);
      }
    }
  }
  
  return result;
};

// Volume Weighted Average Price (VWAP)
export const calculateVWAP = (data: ChartDataPoint[]): (number | null)[] => {
  const result: (number | null)[] = [];
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const priceVolume = typicalPrice * data[i].volume;
    
    cumulativePriceVolume += priceVolume;
    cumulativeVolume += data[i].volume;
    
    if (cumulativeVolume === 0) {
      result.push(null);
    } else {
      result.push(cumulativePriceVolume / cumulativeVolume);
    }
  }
  
  return result;
};

// Average True Range (ATR)
export const calculateATRIndicator = (
  data: ChartDataPoint[], 
  period: number = 14
): (number | null)[] => {
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
  
  // Calculate ATR using EMA
  const atrValues = calculateEMA(trueRanges, period);
  
  // Add null for first value (no previous close)
  return [null, ...atrValues];
};

// On Balance Volume (OBV)
export const calculateOBV = (data: ChartDataPoint[]): (number | null)[] => {
  const result: (number | null)[] = [];
  let obv = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(obv);
    } else {
      const currentClose = data[i].close;
      const previousClose = data[i - 1].close;
      const volume = data[i].volume;
      
      if (currentClose > previousClose) {
        obv += volume;
      } else if (currentClose < previousClose) {
        obv -= volume;
      }
      // If prices are equal, OBV remains unchanged
      
      result.push(obv);
    }
  }
  
  return result;
};

// Commodity Channel Index (CCI)
export const calculateCCI = (
  data: ChartDataPoint[], 
  period: number = 20
): (number | null)[] => {
  const result: (number | null)[] = [];
  const constant = 0.015; // Typical constant for CCI
  
  // Calculate Typical Price
  const typicalPrices = data.map(d => (d.high + d.low + d.close) / 3);
  
  // Calculate SMA of Typical Price
  const smaTP = calculateSMA(typicalPrices, period);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || smaTP[i] === null) {
      result.push(null);
    } else {
      const currentTP = typicalPrices[i];
      const sma = smaTP[i]!;
      
      // Calculate Mean Deviation
      const subset = typicalPrices.slice(i - period + 1, i + 1);
      const meanDeviation = subset.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
      
      if (meanDeviation === 0) {
        result.push(0);
      } else {
        const cci = (currentTP - sma) / (constant * meanDeviation);
        result.push(cci);
      }
    }
  }
  
  return result;
};

// Helper function to get price data based on source
export const getPriceData = (data: ChartDataPoint[], source: string): number[] => {
  switch (source) {
    case 'open':
      return data.map(d => d.open);
    case 'high':
      return data.map(d => d.high);
    case 'low':
      return data.map(d => d.low);
    case 'close':
    default:
      return data.map(d => d.close);
    case 'hl2':
      return data.map(d => (d.high + d.low) / 2);
    case 'hlc3':
      return data.map(d => (d.high + d.low + d.close) / 3);
    case 'ohlc4':
      return data.map(d => (d.open + d.high + d.low + d.close) / 4);
  }
};