import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Volume2, 
  Settings, 
  Maximize2, 
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target
} from 'lucide-react';
import type { ChartDataPoint, ChartSettings, ChartType, Timeframe } from '../../types/chart';
import { useChartData } from '../../hooks/useChartData';
import { useTimeframe } from '../../hooks/useTimeframe';
import { ProfessionalTabs } from '../ui/Tabs';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatPrice, formatVolume } from '../../utils/chartHelpers';

interface TradingChartProps {
  symbol: string;
  height?: number;
  showControls?: boolean;
  showVolume?: boolean;
  className?: string;
  interactive?: boolean; // 🚀 FIXED: Add interactive prop
  onChartReady?: (chart: any) => void;
}

interface CandlestickProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showVolume: boolean;
  interactive?: boolean;
}

interface LineChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
}

interface VolumeChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
}

// 🚀 ADDED: Missing CandlestickChart Component
const CandlestickChart: React.FC<CandlestickProps> = ({ 
  data, 
  width, 
  height, 
  showVolume, 
  interactive = true 
}) => {
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [selectedCandle, setSelectedCandle] = useState<number | null>(null);

  if (!data?.length || width <= 0 || height <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No candlestick data available</p>
        </div>
      </div>
    );
  }

  // Filter valid data
  const validData = data.filter(d => 
    d && 
    typeof d.open === 'number' && 
    typeof d.high === 'number' && 
    typeof d.low === 'number' && 
    typeof d.close === 'number' &&
    !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close) &&
    isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close)
  );

  if (!validData.length) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Invalid candlestick data</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const chartHeight = showVolume ? height * 0.7 : height;
  const volumeHeight = showVolume ? height * 0.3 : 0;
  
  // Get price range
  const prices = validData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Get volume range
  const volumes = validData.map(d => d.volume || 0).filter(v => v > 0);
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 0;

  // Scale functions
  const scaleY = (price: number) => {
    if (!isFinite(price)) return chartHeight / 2;
    return chartHeight - ((price - minPrice + padding) / (priceRange + 2 * padding)) * chartHeight;
  };
  
  const scaleX = (index: number) => (index / Math.max(1, validData.length - 1)) * width;
  
  const scaleVolume = (volume: number) => {
    if (!volume || !maxVolume || !isFinite(volume)) return volumeHeight;
    return volumeHeight - (volume / maxVolume) * volumeHeight;
  };

  const candleWidth = Math.max(2, Math.min(20, width / validData.length * 0.8));

  // 🚀 Interactive handlers
  const handleCandleHover = (index: number) => {
    if (interactive) setHoveredCandle(index);
  };

  const handleCandleClick = (index: number) => {
    if (interactive) setSelectedCandle(selectedCandle === index ? null : index);
  };

  return (
    <div className="relative">
      {/* 🚀 Interactive tooltip */}
      {interactive && hoveredCandle !== null && validData[hoveredCandle] && (
        <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm font-medium">
            {validData[hoveredCandle].time || `Candle ${hoveredCandle + 1}`}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <span>Open: ${validData[hoveredCandle].open.toFixed(2)}</span>
            <span>High: ${validData[hoveredCandle].high.toFixed(2)}</span>
            <span>Low: ${validData[hoveredCandle].low.toFixed(2)}</span>
            <span>Close: ${validData[hoveredCandle].close.toFixed(2)}</span>
            {validData[hoveredCandle].volume && (
              <span className="col-span-2">
                Volume: {formatVolume(validData[hoveredCandle].volume)}
              </span>
            )}
          </div>
          <div className="mt-2 text-xs">
            <span className={validData[hoveredCandle].close >= validData[hoveredCandle].open ? 'text-green-600' : 'text-red-600'}>
              {validData[hoveredCandle].close >= validData[hoveredCandle].open ? '📈 Bullish' : '📉 Bearish'}
            </span>
          </div>
        </div>
      )}

      <svg 
        width={width} 
        height={height} 
        className="candlestick-chart cursor-crosshair"
        style={{ background: 'transparent' }}
        onMouseLeave={() => interactive && setHoveredCandle(null)}
      >
        {/* Grid */}
        <defs>
          <pattern id="candlestickGrid" width="50" height="20" patternUnits="userSpaceOnUse">
            <path 
              d="M 50 0 L 0 0 0 20" 
              fill="none" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#candlestickGrid)" />

        {/* Price Chart Area */}
        <g className="price-area">
          {validData.map((candle, index) => {
            const x = scaleX(index);
            const isGreen = candle.close >= candle.open;
            const bodyTop = scaleY(Math.max(candle.open, candle.close));
            const bodyBottom = scaleY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);
            const isHovered = hoveredCandle === index;
            const isSelected = selectedCandle === index;

            return (
              <g key={index} className="candlestick">
                {/* Wick */}
                <line
                  x1={x}
                  y1={scaleY(candle.high)}
                  x2={x}
                  y2={scaleY(candle.low)}
                  stroke={isGreen ? '#22c55e' : '#ef4444'}
                  strokeWidth={isHovered || isSelected ? "2" : "1"}
                  opacity={isHovered || isSelected ? 1 : 0.8}
                />
                
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? '#22c55e' : '#ef4444'}
                  stroke={isGreen ? '#16a34a' : '#dc2626'}
                  strokeWidth={isHovered || isSelected ? "1.5" : "0.5"}
                  opacity={isHovered || isSelected ? 1 : 0.8}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => handleCandleHover(index)}
                  onClick={() => handleCandleClick(index)}
                />

                {/* 🚀 Interactive hover area */}
                {interactive && (
                  <rect
                    x={x - candleWidth}
                    y={0}
                    width={candleWidth * 2}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => handleCandleHover(index)}
                    onClick={() => handleCandleClick(index)}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Volume Chart Area */}
        {showVolume && maxVolume > 0 && (
          <g className="volume-area" transform={`translate(0, ${chartHeight})`}>
            {validData.map((candle, index) => {
              if (!candle.volume || candle.volume <= 0) return null;
              
              const x = scaleX(index);
              const volumeBarHeight = volumeHeight - scaleVolume(candle.volume);
              const isGreen = candle.close >= candle.open;
              const isHovered = hoveredCandle === index;

              return (
                <rect
                  key={index}
                  x={x - candleWidth / 2}
                  y={scaleVolume(candle.volume)}
                  width={candleWidth}
                  height={Math.max(1, volumeBarHeight)}
                  fill={isGreen ? '#22c55e' : '#ef4444'}
                  opacity={isHovered ? 0.9 : 0.6}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => handleCandleHover(index)}
                  onClick={() => handleCandleClick(index)}
                />
              );
            })}
          </g>
        )}

        {/* Price Labels */}
        <g className="price-labels">
          {[minPrice, (minPrice + maxPrice) / 2, maxPrice].map((price, index) => (
            <g key={index}>
              <line
                x1={0}
                y1={scaleY(price)}
                x2={width}
                y2={scaleY(price)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="0.5"
                opacity="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={width - 5}
                y={scaleY(price) - 5}
                textAnchor="end"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                ${formatPrice(price)}
              </text>
            </g>
          ))}
        </g>

        {/* Current Price Line */}
        {validData.length > 0 && (
          <g className="current-price">
            <line
              x1={0}
              y1={scaleY(validData[validData.length - 1].close)}
              x2={width}
              y2={scaleY(validData[validData.length - 1].close)}
              stroke="#3b82f6"
              strokeWidth="2"
              opacity={0.8}
              strokeDasharray="5,5"
            />
            <text
              x={width - 5}
              y={scaleY(validData[validData.length - 1].close) - 10}
              textAnchor="end"
              fontSize="12"
              fill="#3b82f6"
              fontWeight="bold"
            >
              ${formatPrice(validData[validData.length - 1].close)}
            </text>
          </g>
        )}

        {/* 🚀 Crosshair for interactivity */}
        {interactive && hoveredCandle !== null && (
          <g className="crosshair">
            <line
              x1={scaleX(hoveredCandle)}
              y1={0}
              x2={scaleX(hoveredCandle)}
              y2={height}
              stroke="#3b82f6"
              strokeWidth="1"
              opacity={0.5}
              strokeDasharray="3,3"
            />
          </g>
        )}

        {/* Volume Labels */}
        {showVolume && maxVolume > 0 && (
          <g className="volume-labels" transform={`translate(0, ${chartHeight})`}>
            <text
              x={5}
              y={15}
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              Volume
            </text>
            <text
              x={width - 5}
              y={15}
              textAnchor="end"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              Max: {formatVolume(maxVolume)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// 🚀 ENHANCED: Interactive Line Chart
const LineChart: React.FC<LineChartProps & { interactive?: boolean }> = ({ 
  data, 
  width, 
  height, 
  interactive = true 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  if (!data?.length || width <= 0 || height <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  const prices = data.map(d => d.close).filter(price => !isNaN(price) && isFinite(price));
  
  if (!prices.length) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Invalid price data</p>
        </div>
      </div>
    );
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  const scaleY = (price: number) => {
    if (!isFinite(price)) return height / 2;
    return height - ((price - minPrice + padding) / (priceRange + 2 * padding)) * height;
  };
  
  const scaleX = (index: number) => (index / Math.max(1, data.length - 1)) * width;

  const pathData = data.map((point, index) => {
    const x = scaleX(index);
    const y = scaleY(point.close);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // 🚀 Interactive handlers
  const handlePointHover = (index: number) => {
    if (interactive) setHoveredPoint(index);
  };

  const handlePointClick = (index: number) => {
    if (interactive) setSelectedPoint(selectedPoint === index ? null : index);
  };

  return (
    <div className="relative">
      {/* 🚀 Interactive tooltip */}
      {interactive && hoveredPoint !== null && data[hoveredPoint] && (
        <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm font-medium">
            {data[hoveredPoint].time || `Point ${hoveredPoint + 1}`}
          </div>
          <div className="text-xs mt-2">
            <span>Price: ${data[hoveredPoint].close.toFixed(2)}</span>
            <br />
            <span>Change: {hoveredPoint > 0 ? 
              `${((data[hoveredPoint].close - data[hoveredPoint - 1].close) / data[hoveredPoint - 1].close * 100).toFixed(2)}%` : 
              'N/A'}
            </span>
          </div>
        </div>
      )}

      <svg 
        width={width} 
        height={height} 
        className="line-chart cursor-crosshair"
        style={{ background: 'transparent' }}
        onMouseLeave={() => interactive && setHoveredPoint(null)}
      >
        {/* Grid */}
        <defs>
          <pattern id="lineGrid" width="50" height="20" patternUnits="userSpaceOnUse">
            <path 
              d="M 50 0 L 0 0 0 20" 
              fill="none" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="0.5"
              opacity="0.2"
            />
          </pattern>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <rect width={width} height={height} fill="url(#lineGrid)" />

        {/* Fill area */}
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#lineGradient)"
          opacity={0.3}
        />

        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity={0.8}
        />

        {/* 🚀 Interactive data points */}
        {interactive && data.map((point, index) => {
          const x = scaleX(index);
          const y = scaleY(point.close);
          const isHovered = hoveredPoint === index;
          const isSelected = selectedPoint === index;

          return (
            <g key={index}>
              {/* Hover area */}
              <rect
                x={x - 8}
                y={0}
                width={16}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => handlePointHover(index)}
                onClick={() => handlePointClick(index)}
              />
              
              {/* Data point */}
              <circle
                cx={x}
                cy={y}
                r={isHovered || isSelected ? 4 : 2}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={isHovered || isSelected ? 2 : 1}
                opacity={isHovered || isSelected ? 1 : 0.7}
                className="transition-all duration-150 pointer-events-none"
              />
            </g>
          );
        })}

        {/* 🚀 Crosshair */}
        {interactive && hoveredPoint !== null && (
          <line
            x1={scaleX(hoveredPoint)}
            y1={0}
            x2={scaleX(hoveredPoint)}
            y2={height}
            stroke="#3b82f6"
            strokeWidth="1"
            opacity={0.5}
            strokeDasharray="3,3"
          />
        )}

        {/* Price labels */}
        {[minPrice, maxPrice].map((price, index) => (
          <text
            key={index}
            x={width - 5}
            y={scaleY(price) + (index === 0 ? 15 : -5)}
            textAnchor="end"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            ${formatPrice(price)}
          </text>
        ))}
      </svg>
    </div>
  );
};

// 🚀 ENHANCED: Interactive Volume Chart
const VolumeOnlyChart: React.FC<VolumeChartProps & { interactive?: boolean }> = ({ 
  data, 
  width, 
  height, 
  interactive = true 
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  if (!data?.length || width <= 0 || height <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <Volume2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No volume data</p>
        </div>
      </div>
    );
  }

  const volumes = data.map(d => d.volume).filter(vol => !isNaN(vol) && isFinite(vol) && vol > 0);
  
  if (!volumes.length) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-center">
          <Volume2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Invalid volume data</p>
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(...volumes);
  const scaleY = (volume: number) => {
    if (!isFinite(volume) || volume <= 0) return height;
    return height - (volume / maxVolume) * height;
  };
  
  const scaleX = (index: number) => (index / Math.max(1, data.length - 1)) * width;
  const barWidth = Math.max(1, Math.min(20, width / data.length * 0.8));

  // 🚀 Interactive handlers
  const handleBarHover = (index: number) => {
    if (interactive) setHoveredBar(index);
  };

  const handleBarClick = (index: number) => {
    if (interactive) setSelectedBar(selectedBar === index ? null : index);
  };

  return (
    <div className="relative">
      {/* 🚀 Interactive tooltip */}
      {interactive && hoveredBar !== null && data[hoveredBar] && (
        <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm font-medium">
            {data[hoveredBar].time || `Bar ${hoveredBar + 1}`}
          </div>
          <div className="text-xs mt-2">
            <span>Volume: {formatVolume(data[hoveredBar].volume)}</span>
            <br />
            <span>Type: {data[hoveredBar].close >= data[hoveredBar].open ? 'Buy Volume' : 'Sell Volume'}</span>
            <br />
            <span>% of Max: {((data[hoveredBar].volume / maxVolume) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <svg 
        width={width} 
        height={height} 
        className="volume-chart cursor-crosshair"
        style={{ background: 'transparent' }}
        onMouseLeave={() => interactive && setHoveredBar(null)}
      >
        {/* Grid */}
        <defs>
          <pattern id="volumeGrid" width="50" height="30" patternUnits="userSpaceOnUse">
            <path 
              d="M 50 0 L 0 0 0 30" 
              fill="none" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="0.5"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#volumeGrid)" />

        {/* Volume bars */}
        {data.map((point, index) => {
          if (!point.volume || !isFinite(point.volume) || point.volume <= 0) return null;
          
          const x = scaleX(index);
          const barHeight = height - scaleY(point.volume);
          const isGreen = point.close >= point.open;
          const isHovered = hoveredBar === index;
          const isSelected = selectedBar === index;

          return (
            <g key={index}>
              {/* Volume bar */}
              <rect
                x={x - barWidth / 2}
                y={scaleY(point.volume)}
                width={barWidth}
                height={Math.max(1, barHeight)}
                fill={isGreen ? '#22c55e' : '#ef4444'}
                opacity={isHovered || isSelected ? 1 : 0.7}
                stroke={isSelected ? '#3b82f6' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => handleBarHover(index)}
                onClick={() => handleBarClick(index)}
              />

              {/* 🚀 Interactive hover area */}
              {interactive && (
                <rect
                  x={x - barWidth}
                  y={0}
                  width={barWidth * 2}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => handleBarHover(index)}
                  onClick={() => handleBarClick(index)}
                />
              )}
            </g>
          );
        })}

        {/* 🚀 Crosshair */}
        {interactive && hoveredBar !== null && (
          <line
            x1={scaleX(hoveredBar)}
            y1={0}
            x2={scaleX(hoveredBar)}
            y2={height}
            stroke="#3b82f6"
            strokeWidth="1"
            opacity={0.5}
            strokeDasharray="3,3"
          />
        )}

        {/* Volume labels */}
        <text
          x={width - 5}
          y={20}
          textAnchor="end"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          Max: {formatVolume(maxVolume)}
        </text>
      </svg>
    </div>
  );
};

// Update the LineChartProps interface
interface LineChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  interactive?: boolean; // 🚀 ADDED: Interactive prop
}

// Update the VolumeChartProps interface
interface VolumeChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  interactive?: boolean; // 🚀 ADDED: Interactive prop
}

// (removed duplicate chartTabs definition; use the one inside TradingChart component)

// Update the main TradingChart component to remove the empty chart container
const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  height = 500,
  showControls = true,
  showVolume = true,
  className,
  interactive = true,
  onChartReady,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartSettings, setChartSettings] = useState<Partial<ChartSettings>>({
    showVolume,
    showGrid: true,
    showCrosshair: true,
    theme: 'professional'
  });

  // Use our custom hooks with error handling
  const { 
    chartData, 
    isLoading, 
    error, 
    refreshData, 
    lastUpdated,
    dataQuality 
  } = useChartData({ 
    symbol, 
    initialTimeframe: '1Y',
    autoRefresh: true,
    refreshInterval: 30 
  });

  const { 
    timeframe, 
    setTimeframe, 
    timeframeOptions, 
    dateRange,
    isRealTime,
    marketStatus 
  } = useTimeframe({
    initialTimeframe: '1Y'
  });

  // 🚀 SIMPLIFIED: Chart dimensions without ref dependency
  const [dimensions, setDimensions] = useState({ width: 800, height: height });

  // 🚀 FIXED: Update dimensions without chartRef
  useEffect(() => {
    const updateDimensions = () => {
      // Use window dimensions as fallback
      const width = Math.max(400, window.innerWidth * 0.8);
      setDimensions({
        width: width,
        height: Math.max(200, height)
      });
    };

    const timeoutId = setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [height, isFullscreen]);

  // 🚀 FIXED: Chart tabs configuration
  const chartTabs = useMemo(() => {
    const hasData = chartData?.data && Array.isArray(chartData.data) && chartData.data.length > 0;
    const chartWidth = Math.max(400, dimensions.width - 32);
    const chartHeight = Math.max(200, height - 80);

    return [
      {
        id: 'candlestick',
        label: 'Candlestick',
        icon: <BarChart3 className="w-4 h-4" />,
        content: hasData ? (
          // 🚀 FIXED: Direct chart rendering without extra containers
          <CandlestickChart
            data={chartData.data}
            width={chartWidth}
            height={chartHeight}
            showVolume={chartSettings.showVolume || false}
            interactive={interactive}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">
                {isLoading ? 'Loading candlestick chart...' : 'No candlestick data available'}
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'line',
        label: 'Line',
        icon: <TrendingUp className="w-4 h-4" />,
        content: hasData ? (
          // 🚀 FIXED: Direct chart rendering
          <LineChart
            data={chartData.data}
            width={chartWidth}
            height={chartHeight}
            interactive={interactive}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">
                {isLoading ? 'Loading line chart...' : 'No line chart data available'}
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'volume',
        label: 'Volume',
        icon: <Volume2 className="w-4 h-4" />,
        content: hasData ? (
          // 🚀 FIXED: Direct chart rendering
          <VolumeOnlyChart
            data={chartData.data}
            width={chartWidth}
            height={chartHeight}
            interactive={interactive}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="text-center">
              <Volume2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">
                {isLoading ? 'Loading volume chart...' : 'No volume data available'}
              </p>
            </div>
          </div>
        )
      }
    ];
  }, [chartData, dimensions, chartSettings.showVolume, height, interactive, isLoading]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle chart export
  const exportChart = useCallback(() => {
    console.log('Exporting chart...', { symbol, data: chartData });
    // Add actual export logic here
  }, [symbol, chartData]);

  // Error state
  if (error) {
    return (
      <div className={cn('p-6 text-center border border-red-200 rounded-lg bg-red-50', className)}>
        <div className="text-red-600 mb-2 font-medium">Chart Error</div>
        <div className="text-sm text-red-500 mb-4">{error.toString()}</div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('trading-chart-container w-full bg-transparent', className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-transparent">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-lg">{symbol || 'Unknown Symbol'}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{dateRange?.label || 'Unknown Range'}</span>
              <Badge 
                variant={marketStatus === 'open' ? 'success' : 'secondary'}
                size="sm"
              >
                {marketStatus?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              </Badge>
              {isRealTime && (
                <Badge variant="default" size="sm" className="animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
          </div>

          {chartData?.totalPoints && (
            <div className="text-sm">
              <div className="text-muted-foreground">Data Points</div>
              <div className="font-medium">{chartData.totalPoints.toLocaleString()}</div>
            </div>
          )}

          {dataQuality?.dataCompleteness && dataQuality.dataCompleteness < 1 && (
            <Badge variant="warning" size="sm">
              {Math.round(dataQuality.dataCompleteness * 100)}% Complete
            </Badge>
          )}
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 mr-4">
              {timeframeOptions?.slice(0, 6).map((option) => (
                <Button
                  key={option.value}
                  variant={timeframe === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(option.value)}
                  className="h-8 px-2 text-xs"
                >
                  {option.shortLabel}
                </Button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
              <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>

            <Button variant="ghost" size="sm" onClick={exportChart}>
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Chart Content - 🚀 STREAMLINED: No extra containers */}
      <div className="relative bg-transparent">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading chart data...</span>
            </div>
          </div>
        )}

        {/* 🚀 FIXED: Direct chart tabs rendering - NO extra containers */}
        <ProfessionalTabs
          tabs={chartTabs}
          defaultTab="candlestick"
          variant="professional"
        />

        {/* Chart Footer */}
        {lastUpdated && (
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                Last updated: {lastUpdated.toLocaleTimeString()}
                {isRealTime && <span className="ml-2">• Real-time data</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">✅ Charts Active</Badge>
                {interactive && <Badge variant="default" size="sm">🔥 Interactive</Badge>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingChart;