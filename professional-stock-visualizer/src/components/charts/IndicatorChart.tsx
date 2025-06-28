import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  Settings2
} from 'lucide-react';
import type { ChartDataPoint } from '../../types/chart';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { ProfessionalTabs } from '../ui/Tabs';
import Slider from '../ui/Slider';
import { cn } from '../../utils/cn';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateSMA,
  calculateEMA,
  getPriceData
} from '../../utils/technicalIndicators';

// 🚀 FIXED: Updated interface with all required props
interface IndicatorChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  className?: string;
  interactive?: boolean; // 🚀 ADDED: Interactive flag
  indicators?: string[]; // 🚀 ADDED: Indicators array
  onIndicatorChange?: (indicator: string) => void; // 🚀 ADDED: Callback
}

interface RSIChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  period: number;
  interactive?: boolean;
}

interface MACDChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  interactive?: boolean;
}

interface BollingerBandsChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  period: number;
  stdDev: number;
  interactive?: boolean;
}

interface MovingAverageChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  periods: number[];
  interactive?: boolean;
}

// 🚀 ENHANCED: Interactive RSI Chart
const RSIChart: React.FC<RSIChartProps> = ({ 
  data, 
  width, 
  height, 
  period,
  interactive = true 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 🚀 FIXED: Proper error handling
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for RSI calculation</p>
        </div>
      </div>
    );
  }

  const closePrices = getPriceData(data, 'close');
  const rsiValues = calculateRSI(closePrices, period);
  
  if (!rsiValues.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Insufficient data for RSI calculation</p>
          <p className="text-xs text-muted-foreground">Need at least {period + 1} data points</p>
        </div>
      </div>
    );
  }

  const scaleX = (index: number) => (index / (rsiValues.length - 1)) * width;
  const scaleY = (value: number) => height - (value / 100) * height;

  // Generate RSI line path
  const rsiPath = rsiValues
    .map((value, index) => {
      if (value === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(value)}`;
    })
    .filter(Boolean)
    .join(' ');

  // Find current RSI value and signal
  const currentRSI = rsiValues[rsiValues.length - 1];
  const signal = currentRSI ? (
    currentRSI > 70 ? 'Overbought' :
    currentRSI < 30 ? 'Oversold' : 'Neutral'
  ) : 'No Signal';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">RSI ({period})</h4>
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              signal === 'Overbought' ? 'destructive' :
              signal === 'Oversold' ? 'default' : 'secondary'
            }
            size="sm"
          >
            {signal}
          </Badge>
          {currentRSI && (
            <span className="text-sm font-medium">
              {currentRSI.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {/* 🚀 Interactive tooltip */}
        {interactive && hoveredPoint !== null && rsiValues[hoveredPoint] && (
          <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
            <div className="text-sm font-medium">
              RSI: {rsiValues[hoveredPoint]?.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Point {hoveredPoint + 1} of {rsiValues.length}
            </div>
          </div>
        )}

        <svg 
          width={width} 
          height={height} 
          className="rsi-chart cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect width={width} height={height} fill="transparent" />
          
          {/* Overbought/Oversold zones */}
          <rect 
            x="0" 
            y="0" 
            width={width} 
            height={scaleY(70)} 
            fill="#ef4444" 
            opacity="0.1" 
          />
          <rect 
            x="0" 
            y={scaleY(30)} 
            width={width} 
            height={height - scaleY(30)} 
            fill="#22c55e" 
            opacity="0.1" 
          />
          
          {/* Reference lines */}
          {[30, 50, 70].map(level => (
            <g key={level}>
              <line
                x1="0"
                y1={scaleY(level)}
                x2={width}
                y2={scaleY(level)}
                stroke={level === 50 ? '#64748b' : level === 70 ? '#ef4444' : '#22c55e'}
                strokeWidth={level === 50 ? "1" : "0.5"}
                strokeDasharray={level === 50 ? "none" : "2,2"}
                opacity="0.6"
              />
              <text
                x={width - 5}
                y={scaleY(level) - 5}
                textAnchor="end"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                {level}
              </text>
            </g>
          ))}
          
          {/* RSI line */}
          <path
            d={rsiPath}
            stroke="#3b82f6"
            strokeWidth="2"
            fill="none"
          />
          
          {/* 🚀 Interactive hover points */}
          {interactive && rsiValues.map((value, index) => {
            if (value === null) return null;
            return (
              <circle
                key={index}
                cx={scaleX(index)}
                cy={scaleY(value)}
                r={hoveredPoint === index ? "4" : "2"}
                fill="#3b82f6"
                stroke="white"
                strokeWidth="1"
                opacity={hoveredPoint === index ? 1 : 0.7}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(index)}
                onClick={() => setHoveredPoint(hoveredPoint === index ? null : index)}
              />
            );
          })}
          
          {/* Current value dot */}
          {currentRSI && (
            <circle
              cx={scaleX(rsiValues.length - 1)}
              cy={scaleY(currentRSI)}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

// 🚀 ENHANCED: Interactive MACD Chart
const MACDChart: React.FC<MACDChartProps> = ({ 
  data, 
  width, 
  height, 
  fastPeriod, 
  slowPeriod, 
  signalPeriod,
  interactive = true 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 🚀 FIXED: Proper error handling
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for MACD calculation</p>
        </div>
      </div>
    );
  }

  const closePrices = getPriceData(data, 'close');
  const macdData = calculateMACD(closePrices, fastPeriod, slowPeriod, signalPeriod);
  
  if (!macdData.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Insufficient data for MACD calculation</p>
          <p className="text-xs text-muted-foreground">Need at least {Math.max(fastPeriod, slowPeriod) + signalPeriod} data points</p>
        </div>
      </div>
    );
  }

  // Get valid values for scaling
  const validMacd = macdData.filter(d => d.macd !== null).map(d => d.macd!);
  const validSignal = macdData.filter(d => d.signal !== null).map(d => d.signal!);
  const validHistogram = macdData.filter(d => d.histogram !== null).map(d => d.histogram!);
  
  if (validMacd.length === 0 && validSignal.length === 0 && validHistogram.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">No valid MACD values calculated</p>
        </div>
      </div>
    );
  }

  const allValues = [...validMacd, ...validSignal, ...validHistogram];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;

  const scaleX = (index: number) => (index / (macdData.length - 1)) * width;
  const scaleY = (value: number) => 
    height - ((value - minValue + padding) / (range + 2 * padding)) * height;

  // Zero line
  const zeroY = scaleY(0);

  // Generate paths
  const macdPath = macdData
    .map((d, index) => {
      if (d.macd === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.macd)}`;
    })
    .filter(Boolean)
    .join(' ');

  const signalPath = macdData
    .map((d, index) => {
      if (d.signal === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.signal)}`;
    })
    .filter(Boolean)
    .join(' ');

  // Current values
  const currentData = macdData[macdData.length - 1];
  const signal = currentData?.histogram ? (
    currentData.histogram > 0 ? 'Bullish' : 'Bearish'
  ) : 'Neutral';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">MACD ({fastPeriod},{slowPeriod},{signalPeriod})</h4>
        <div className="flex items-center gap-2">
          <Badge 
            variant={signal === 'Bullish' ? 'default' : signal === 'Bearish' ? 'destructive' : 'secondary'}
            size="sm"
          >
            {signal}
          </Badge>
          {currentData?.macd && (
            <span className="text-sm font-medium">
              {currentData.macd.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        {/* 🚀 Interactive tooltip */}
        {interactive && hoveredPoint !== null && macdData[hoveredPoint] && (
          <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
            <div className="text-sm font-medium">MACD Analysis</div>
            <div className="grid grid-cols-1 gap-1 text-xs mt-2">
              <span>MACD: {macdData[hoveredPoint].macd?.toFixed(3) || 'N/A'}</span>
              <span>Signal: {macdData[hoveredPoint].signal?.toFixed(3) || 'N/A'}</span>
              <span>Histogram: {macdData[hoveredPoint].histogram?.toFixed(3) || 'N/A'}</span>
            </div>
          </div>
        )}

        <svg 
          width={width} 
          height={height} 
          className="macd-chart cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect width={width} height={height} fill="transparent" />
          
          {/* Zero line */}
          <line
            x1="0"
            y1={zeroY}
            x2={width}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.6"
          />
          
          {/* Histogram bars */}
          {macdData.map((d, index) => {
            if (d.histogram === null) return null;
            
            const x = scaleX(index);
            const barHeight = Math.abs(scaleY(d.histogram) - zeroY);
            const isPositive = d.histogram > 0;
            const isHovered = hoveredPoint === index;
            
            return (
              <rect
                key={`hist-${index}`}
                x={x - 1}
                y={isPositive ? scaleY(d.histogram) : zeroY}
                width="2"
                height={barHeight}
                fill={isPositive ? '#22c55e' : '#ef4444'}
                opacity={isHovered ? 0.9 : 0.6}
                className={interactive ? "cursor-pointer transition-all duration-150" : ""}
                onMouseEnter={() => interactive && setHoveredPoint(index)}
                onClick={() => interactive && setHoveredPoint(hoveredPoint === index ? null : index)}
              />
            );
          })}
          
          {/* MACD line */}
          <path
            d={macdPath}
            stroke="#3b82f6"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Signal line */}
          <path
            d={signalPath}
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
            strokeDasharray="3,3"
          />
          
          {/* Legend */}
          <g className="legend" transform="translate(10, 10)">
            <rect x="0" y="0" width="140" height="50" fill="rgba(0,0,0,0.8)" rx="4" />
            
            <line x1="5" y1="12" x2="20" y2="12" stroke="#3b82f6" strokeWidth="2" />
            <text x="25" y="15" fontSize="10" fill="white">MACD</text>
            
            <line x1="5" y1="26" x2="20" y2="26" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
            <text x="25" y="29" fontSize="10" fill="white">Signal</text>
            
            <rect x="5" y="35" width="8" height="6" fill="#22c55e" />
            <text x="18" y="40" fontSize="10" fill="white">Histogram</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// 🚀 ENHANCED: Interactive Bollinger Bands Chart
const BollingerBandsChart: React.FC<BollingerBandsChartProps> = ({ 
  data, 
  width, 
  height, 
  period, 
  stdDev,
  interactive = true 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 🚀 FIXED: Proper error handling
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for Bollinger Bands calculation</p>
        </div>
      </div>
    );
  }

  const closePrices = getPriceData(data, 'close');
  const bollingerData = calculateBollingerBands(closePrices, period, stdDev);
  
  if (!bollingerData.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Insufficient data for Bollinger Bands calculation</p>
          <p className="text-xs text-muted-foreground">Need at least {period} data points</p>
        </div>
      </div>
    );
  }

  // Get price range for scaling
  const validPrices = data.map(d => d.close);
  const validBands = bollingerData.filter(d => d.upper !== null);
  
  if (validBands.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">No valid Bollinger Band values calculated</p>
        </div>
      </div>
    );
  }

  const allValues = [
    ...validPrices,
    ...validBands.map(d => d.upper!),
    ...validBands.map(d => d.lower!)
  ];
  
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.05;

  const scaleX = (index: number) => (index / (data.length - 1)) * width;
  const scaleY = (price: number) => 
    height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * height;

  // Generate paths
  const pricePath = data
    .map((d, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.close)}`)
    .join(' ');

  const upperBandPath = bollingerData
    .map((d, index) => {
      if (d.upper === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.upper)}`;
    })
    .filter(Boolean)
    .join(' ');

  const lowerBandPath = bollingerData
    .map((d, index) => {
      if (d.lower === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.lower)}`;
    })
    .filter(Boolean)
    .join(' ');

  const middleBandPath = bollingerData
    .map((d, index) => {
      if (d.middle === null) return null;
      return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.middle)}`;
    })
    .filter(Boolean)
    .join(' ');

  // Create band fill area
  const bandFillPath = bollingerData
    .map((d, index) => {
      if (d.upper === null || d.lower === null) return null;
      if (index === 0) {
        return `M ${scaleX(index)} ${scaleY(d.upper)} L ${scaleX(index)} ${scaleY(d.lower)}`;
      }
      return `L ${scaleX(index)} ${scaleY(d.upper)}`;
    })
    .filter(Boolean)
    .join(' ') + ' ' +
    bollingerData
    .slice()
    .reverse()
    .map((d, index) => {
      if (d.lower === null) return null;
      const originalIndex = bollingerData.length - 1 - index;
      return `L ${scaleX(originalIndex)} ${scaleY(d.lower)}`;
    })
    .filter(Boolean)
    .join(' ') + ' Z';

  // Current analysis
  const currentPrice = data[data.length - 1]?.close;
  const currentBand = bollingerData[bollingerData.length - 1];
  let position = 'Middle';
  
  if (currentBand && currentPrice) {
    if (currentPrice > (currentBand.upper || 0)) position = 'Above Upper';
    else if (currentPrice < (currentBand.lower || 0)) position = 'Below Lower';
    else if (currentPrice > (currentBand.middle || 0)) position = 'Upper Half';
    else position = 'Lower Half';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Bollinger Bands ({period}, {stdDev})</h4>
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              position.includes('Above') ? 'destructive' :
              position.includes('Below') ? 'default' : 'secondary'
            }
            size="sm"
          >
            {position}
          </Badge>
        </div>
      </div>

      <div className="relative">
        {/* 🚀 Interactive tooltip */}
        {interactive && hoveredPoint !== null && bollingerData[hoveredPoint] && (
          <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
            <div className="text-sm font-medium">Bollinger Bands</div>
            <div className="grid grid-cols-1 gap-1 text-xs mt-2">
              <span>Upper: ${bollingerData[hoveredPoint].upper?.toFixed(2) || 'N/A'}</span>
              <span>Middle: ${bollingerData[hoveredPoint].middle?.toFixed(2) || 'N/A'}</span>
              <span>Lower: ${bollingerData[hoveredPoint].lower?.toFixed(2) || 'N/A'}</span>
              <span>Price: ${data[hoveredPoint]?.close.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        )}

        <svg 
          width={width} 
          height={height} 
          className="bollinger-chart cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect width={width} height={height} fill="transparent" />
          
          {/* Band fill area */}
          <path
            d={bandFillPath}
            fill="#3b82f6"
            opacity="0.1"
          />
          
          {/* Upper band */}
          <path
            d={upperBandPath}
            stroke="#ef4444"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2,2"
          />
          
          {/* Lower band */}
          <path
            d={lowerBandPath}
            stroke="#22c55e"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2,2"
          />
          
          {/* Middle band (SMA) */}
          <path
            d={middleBandPath}
            stroke="#3b82f6"
            strokeWidth="1"
            fill="none"
          />
          
          {/* Price line */}
          <path
            d={pricePath}
            stroke="#000"
            strokeWidth="2"
            fill="none"
          />

          {/* 🚀 Interactive hover areas */}
          {interactive && data.map((_, index) => (
            <rect
              key={index}
              x={scaleX(index) - 5}
              y={0}
              width="10"
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(index)}
              onClick={() => setHoveredPoint(hoveredPoint === index ? null : index)}
            />
          ))}
          
          {/* Legend */}
          <g className="legend" transform="translate(10, 10)">
            <rect x="0" y="0" width="120" height="65" fill="rgba(0,0,0,0.8)" rx="4" />
            
            <line x1="5" y1="12" x2="20" y2="12" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            <text x="25" y="15" fontSize="10" fill="white">Upper Band</text>
            
            <line x1="5" y1="26" x2="20" y2="26" stroke="#3b82f6" strokeWidth="1" />
            <text x="25" y="29" fontSize="10" fill="white">Middle (SMA)</text>
            
            <line x1="5" y1="40" x2="20" y2="40" stroke="#22c55e" strokeWidth="1" strokeDasharray="2,2" />
            <text x="25" y="43" fontSize="10" fill="white">Lower Band</text>
            
            <line x="5" y1="54" x2="20" y2="54" stroke="#000" strokeWidth="2" />
            <text x="25" y="57" fontSize="10" fill="white">Price</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// 🚀 ENHANCED: Interactive Moving Average Chart
const MovingAverageChart: React.FC<MovingAverageChartProps> = ({ 
  data, 
  width, 
  height, 
  periods,
  interactive = true 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 🚀 FIXED: Proper error handling
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available for Moving Averages calculation</p>
        </div>
      </div>
    );
  }

  const closePrices = getPriceData(data, 'close');
  
  // Calculate different moving averages
  const movingAverages = periods.map(period => ({
    period,
    sma: calculateSMA(closePrices, period),
    ema: calculateEMA(closePrices, period),
    color: getColorForPeriod(period)
  }));

  // Check if we have valid moving averages
  const hasValidData = movingAverages.some(ma => 
    ma.sma.some(value => value !== null)
  );

  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Insufficient data for Moving Averages calculation</p>
          <p className="text-xs text-muted-foreground">Need at least {Math.max(...periods)} data points</p>
        </div>
      </div>
    );
  }

  // Get price range for scaling
  const allValues = [
    ...closePrices,
    ...movingAverages.flatMap(ma => ma.sma.filter(v => v !== null) as number[])
  ];
  
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.05;

  const scaleX = (index: number) => (index / (data.length - 1)) * width;
  const scaleY = (price: number) => 
    height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * height;

  // Price path
  const pricePath = data
    .map((d, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(d.close)}`)
    .join(' ');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Moving Averages</h4>
        <div className="flex items-center gap-2">
          {periods.map(period => (
            <Badge key={period} variant="secondary" size="sm">
              MA{period}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* 🚀 Interactive tooltip */}
        {interactive && hoveredPoint !== null && (
          <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
            <div className="text-sm font-medium">Moving Averages</div>
            <div className="grid grid-cols-1 gap-1 text-xs mt-2">
              <span>Price: ${data[hoveredPoint]?.close.toFixed(2) || 'N/A'}</span>
              {movingAverages.map(({ period, sma }) => (
                <span key={period}>
                  MA{period}: ${sma[hoveredPoint]?.toFixed(2) || 'N/A'}
                </span>
              ))}
            </div>
          </div>
        )}

        <svg 
          width={width} 
          height={height} 
          className="ma-chart cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect width={width} height={height} fill="transparent" />
          
          {/* Moving average lines */}
          {movingAverages.map(({ period, sma, color }) => {
            const path = sma
              .map((value, index) => {
                if (value === null) return null;
                return `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(value)}`;
              })
              .filter(Boolean)
              .join(' ');

            return (
              <path
                key={period}
                d={path}
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
            );
          })}
          
          {/* Price line */}
          <path
            d={pricePath}
            stroke="#000"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />

          {/* 🚀 Interactive hover areas */}
          {interactive && data.map((_, index) => (
            <rect
              key={index}
              x={scaleX(index) - 5}
              y={0}
              width="10"
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(index)}
              onClick={() => setHoveredPoint(hoveredPoint === index ? null : index)}
            />
          ))}
          
          {/* Legend */}
          <g className="legend" transform="translate(10, 10)">
            <rect 
              x="0" 
              y="0" 
              width="80" 
              height={15 * (periods.length + 1) + 10} 
              fill="rgba(0,0,0,0.8)" 
              rx="4" 
            />
            
            <line x1="5" y1="12" x2="20" y2="12" stroke="#000" strokeWidth="1" />
            <text x="25" y="15" fontSize="10" fill="white">Price</text>
            
            {movingAverages.map(({ period, color }, index) => (
              <g key={period}>
                <line 
                  x1="5" 
                  y1={26 + index * 14} 
                  x2="20" 
                  y2={26 + index * 14} 
                  stroke={color} 
                  strokeWidth="2" 
                />
                <text 
                  x="25" 
                  y={29 + index * 14} 
                  fontSize="10" 
                  fill="white"
                >
                  MA{period}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Helper function to get color for period
const getColorForPeriod = (period: number): string => {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];
  return colors[period % colors.length];
};

// Indicator Settings Component
const IndicatorSettings: React.FC<{
  indicator: string;
  settings: any;
  onSettingsChange: (settings: any) => void;
}> = ({ indicator, settings, onSettingsChange }) => {
  const handleChange = (key: string, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const renderSettings = () => {
    switch (indicator) {
      case 'rsi':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Period</label>
              <Slider
                value={[settings.period || 14]}
                onValueChange={([value]) => handleChange('period', value)}
                min={5}
                max={50}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Current: {settings.period || 14}
              </div>
            </div>
          </div>
        );
      
      case 'macd':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Fast Period</label>
              <Slider
                value={[settings.fastPeriod || 12]}
                onValueChange={([value]) => handleChange('fastPeriod', value)}
                min={5}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slow Period</label>
              <Slider
                value={[settings.slowPeriod || 26]}
                onValueChange={([value]) => handleChange('slowPeriod', value)}
                min={10}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Signal Period</label>
              <Slider
                value={[settings.signalPeriod || 9]}
                onValueChange={([value]) => handleChange('signalPeriod', value)}
                min={5}
                max={20}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        );
      
      case 'bollinger':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Period</label>
              <Slider
                value={[settings.period || 20]}
                onValueChange={([value]) => handleChange('period', value)}
                min={10}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Standard Deviation</label>
              <Slider
                value={[settings.stdDev || 2]}
                onValueChange={([value]) => handleChange('stdDev', value)}
                min={1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
        );
      
      default:
        return <div>No settings available</div>;
    }
  };

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Settings2 className="w-4 h-4" />
        {indicator.toUpperCase()} Settings
      </h4>
      {renderSettings()}
    </Card>
  );
};

// 🚀 FIXED: Main Indicator Chart Component with all props
const IndicatorChart: React.FC<IndicatorChartProps> = ({
  data,
  width = 800,
  height = 300,
  className,
  interactive = true, // 🚀 FIXED: Now accepts interactive prop
  indicators = ['rsi', 'macd', 'bollinger', 'ma'], // 🚀 FIXED: Now accepts indicators prop
  onIndicatorChange // 🚀 FIXED: Now accepts callback
}) => {
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0] || 'rsi');
  const [showSettings, setShowSettings] = useState(false);
  const [indicatorSettings, setIndicatorSettings] = useState({
    rsi: { period: 14 },
    macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    bollinger: { period: 20, stdDev: 2 },
    ma: { periods: [20, 50, 200] }
  });

  // Handle indicator change
  const handleIndicatorChange = (indicator: string) => {
    setSelectedIndicator(indicator);
    onIndicatorChange?.(indicator);
  };

  // Filter indicators based on available ones
  const availableIndicators = [
    { id: 'rsi', label: 'RSI', icon: <Activity className="w-4 h-4" /> },
    { id: 'macd', label: 'MACD', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'bollinger', label: 'Bollinger Bands', icon: <Target className="w-4 h-4" /> },
    { id: 'ma', label: 'Moving Averages', icon: <BarChart3 className="w-4 h-4" /> }
  ].filter(indicator => indicators.includes(indicator.id));

  const indicatorTabs = availableIndicators.map(({ id, label, icon }) => ({
    id,
    label,
    icon,
    content: (() => {
      switch (id) {
        case 'rsi':
          return (
            <RSIChart
              data={data}
              width={width}
              height={height}
              period={indicatorSettings.rsi.period}
              interactive={interactive}
            />
          );
        case 'macd':
          return (
            <MACDChart
              data={data}
              width={width}
              height={height}
              fastPeriod={indicatorSettings.macd.fastPeriod}
              slowPeriod={indicatorSettings.macd.slowPeriod}
              signalPeriod={indicatorSettings.macd.signalPeriod}
              interactive={interactive}
            />
          );
        case 'bollinger':
          return (
            <BollingerBandsChart
              data={data}
              width={width}
              height={height}
              period={indicatorSettings.bollinger.period}
              stdDev={indicatorSettings.bollinger.stdDev}
              interactive={interactive}
            />
          );
        case 'ma':
          return (
            <MovingAverageChart
              data={data}
              width={width}
              height={height}
              periods={indicatorSettings.ma.periods}
              interactive={interactive}
            />
          );
        default:
          return <div>Indicator not available</div>;
      }
    })()
  }));

  return (
    <div className={cn('indicator-chart-container w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Technical Indicators</h3>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {interactive ? '🔥 Interactive' : '📊 Static'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex w-full">
        <div className={cn("flex-1", showSettings && "pr-4")}>
          <ProfessionalTabs
            tabs={indicatorTabs}
            defaultTab={selectedIndicator}
            variant="professional"
            onTabChange={handleIndicatorChange}
          />
        </div>

        {showSettings && (
          <div className="w-80 border-l border-border p-4">
            <IndicatorSettings
              indicator={selectedIndicator}
              settings={indicatorSettings[selectedIndicator as keyof typeof indicatorSettings]}
              onSettingsChange={(newSettings) =>
                setIndicatorSettings(prev => ({
                  ...prev,
                  [selectedIndicator]: newSettings
                }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorChart;