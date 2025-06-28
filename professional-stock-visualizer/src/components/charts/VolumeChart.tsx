import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Info,
  Target,
  Volume2
} from 'lucide-react';
import type { ChartDataPoint } from '../../types/chart';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { ProfessionalTabs } from '../ui/Tabs';
import { cn } from '../../utils/cn';
import { formatVolume, formatPrice } from '../../utils/chartHelpers';

interface VolumeChartProps {
  data: any[];
  width?: number;
  height?: number;
  showProfile?: boolean;
  interactive?: boolean; // 🚀 FIXED: Add interactive prop
  className?: string;
}

interface VolumeBarChartProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  interactive?: boolean;
}

// 🚀 ENHANCED: Full-Width Volume Bar Chart Component
const VolumeBarChart: React.FC<VolumeBarChartProps> = ({
  data,
  width,
  height,
  interactive = true
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No volume data available</p>
        </div>
      </div>
    );
  }

  const volumes = data.map(d => d.volume || 0).filter(v => v > 0);
  if (!volumes.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">No valid volume data</p>
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(...volumes);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  // 🚀 MAXIMIZED: Full-width bars with better spacing
  const barWidth = Math.max(3, Math.min(40, (width - 60) / data.length)); // Leave space for labels
  const barSpacing = Math.max(0.5, barWidth * 0.05); // Minimal spacing
  
  const scaleX = (index: number) => {
    // Better distribution across full width
    const usableWidth = width - 60; // Leave 30px on each side for labels
    return 30 + (index / Math.max(1, data.length - 1)) * usableWidth;
  };
  
  const scaleY = (volume: number) => {
    if (!volume || volume <= 0) return height - 40; // Leave space for labels
    const usableHeight = height - 80; // Leave 40px top, 40px bottom
    return 40 + usableHeight - (volume / maxVolume) * usableHeight;
  };

  return (
    // 🚀 FIXED: Single container with full height utilization
    <div className="w-full h-full relative">
      {/* 🚀 MINIMIZED: Compact header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
        <h4 className="font-semibold text-sm">📊 Volume Analysis</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm" className="text-xs">
            {data.length} Bars
          </Badge>
          <Badge variant="success" size="sm" className="text-xs">
            Interactive
          </Badge>
        </div>
      </div>

      {/* 🚀 ENHANCED: Full-height chart area */}
      <div className="relative w-full" style={{ height: 'calc(100% - 50px)' }}>
        {/* Interactive tooltip */}
        {interactive && hoveredBar !== null && data[hoveredBar] && (
          <div className="absolute top-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-20">
            <div className="text-sm font-medium">Volume Details</div>
            <div className="grid grid-cols-1 gap-1 text-xs mt-2">
              <span>Volume: {(data[hoveredBar].volume / 1e6).toFixed(2)}M</span>
              <span>vs Avg: {((data[hoveredBar].volume / avgVolume) * 100).toFixed(0)}%</span>
              <span>Type: {data[hoveredBar].close >= data[hoveredBar].open ? '🟢 Bullish' : '🔴 Bearish'}</span>
              <span>Date: {data[hoveredBar].time || `Session ${hoveredBar + 1}`}</span>
            </div>
          </div>
        )}

        {/* 🚀 MAXIMIZED: Full-size SVG chart */}
        <svg 
          width="100%" 
          height="100%" 
          className="volume-bar-chart cursor-crosshair"
          viewBox={`0 0 ${width} ${height - 50}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Background grid */}
          <defs>
            <pattern id="volumeBarGrid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 30" 
                fill="none" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth="0.3"
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#volumeBarGrid)" />

          {/* Average volume reference line */}
          <line
            x1="30"
            y1={scaleY(avgVolume)}
            x2={width - 30}
            y2={scaleY(avgVolume)}
            stroke="#6b7280"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.5"
          />
          <text
            x={width - 35}
            y={scaleY(avgVolume) - 3}
            textAnchor="end"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            Avg: {(avgVolume / 1e6).toFixed(1)}M
          </text>

          {/* 🚀 ENHANCED: Full-width volume bars with optimal spacing */}
          {data.map((point, index) => {
            if (!point.volume || point.volume <= 0) return null;
            
            const x = scaleX(index);
            const barHeight = (height - 80) - (scaleY(point.volume) - 40);
            const isGreen = point.close >= point.open;
            const isHovered = hoveredBar === index;
            const isAboveAvg = point.volume > avgVolume;
            
            // 🚀 MAXIMIZED: Wider bars with better visibility
            const actualBarWidth = Math.max(barWidth, 4);
            const barX = x - actualBarWidth / 2;

            return (
              <g key={index}>
                {/* Main volume bar */}
                <rect
                  x={barX}
                  y={scaleY(point.volume)}
                  width={actualBarWidth}
                  height={Math.max(2, barHeight)}
                  fill={isGreen ? '#22c55e' : '#ef4444'}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isAboveAvg ? '#3b82f6' : 'none'}
                  strokeWidth={isAboveAvg ? 0.5 : 0}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => interactive && setHoveredBar(index)}
                  onClick={() => interactive && setHoveredBar(hoveredBar === index ? null : index)}
                />

                {/* Volume intensity indicator for above-average volumes */}
                {isAboveAvg && (
                  <rect
                    x={barX}
                    y={scaleY(point.volume)}
                    width={actualBarWidth}
                    height={Math.min(3, barHeight)}
                    fill="#3b82f6"
                    opacity={0.8}
                  />
                )}

                {/* Interactive hover area - wider for better UX */}
                {interactive && (
                  <rect
                    x={barX - 3}
                    y={40}
                    width={actualBarWidth + 6}
                    height={height - 80}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredBar(index)}
                    onClick={() => setHoveredBar(hoveredBar === index ? null : index)}
                  />
                )}
              </g>
            );
          })}

          {/* Y-axis volume scale labels */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const volume = maxVolume * ratio;
            const y = scaleY(volume);
            return (
              <g key={ratio}>
                <line
                  x1={25}
                  y1={y}
                  x2={30}
                  y2={y}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="0.5"
                  opacity="0.6"
                />
                <text
                  x={20}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="hsl(var(--muted-foreground))"
                >
                  {(volume / 1e6).toFixed(1)}M
                </text>
              </g>
            );
          })}

          {/* X-axis time labels - show only key points to avoid clutter */}
          {data.map((point, index) => {
            // Show labels for every 10th bar or important points
            if (index % Math.max(1, Math.floor(data.length / 8)) !== 0 && 
                index !== 0 && 
                index !== data.length - 1) return null;
            
            const x = scaleX(index);
            return (
              <text
                key={`time-${index}`}
                x={x}
                y={height - 25}
                textAnchor="middle"
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
                transform={`rotate(-45, ${x}, ${height - 25})`}
              >
                {point.time ? 
                  new Date(point.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                  `${index + 1}`
                }
              </text>
            );
          })}

          {/* Crosshair for hovered bar */}
          {interactive && hoveredBar !== null && (
            <line
              x1={scaleX(hoveredBar)}
              y1={40}
              x2={scaleX(hoveredBar)}
              y2={height - 40}
              stroke="#3b82f6"
              strokeWidth="1"
              opacity={0.6}
              strokeDasharray="2,2"
            />
          )}

          {/* Chart title and max volume indicator */}
          <text
            x={30}
            y={25}
            fontSize="11"
            fontWeight="bold"
            fill="hsl(var(--foreground))"
          >
            Volume Analysis
          </text>
          <text
            x={width - 30}
            y={25}
            textAnchor="end"
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
          >
            Peak: {(maxVolume / 1e6).toFixed(1)}M
          </text>
        </svg>
      </div>
    </div>
  );
};

// 🚀 FIXED: Volume Profile Chart Component with complete implementation
const VolumeProfileChart: React.FC<{
  data: any[];
  width: number;
  height: number;
  interactive?: boolean;
}> = ({ data, width, height, interactive = true }) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Calculate complete volume profile with error handling
  const volumeProfile = useMemo(() => {
    if (!data?.length) return [];

    const validData = data.filter(d => 
      d && 
      typeof d.close === 'number' && 
      typeof d.high === 'number' && 
      typeof d.low === 'number' &&
      typeof d.volume === 'number' &&
      !isNaN(d.close) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.volume) &&
      isFinite(d.close) && isFinite(d.high) && isFinite(d.low) && isFinite(d.volume) &&
      d.volume > 0 && d.high >= d.low
    );

    if (!validData.length) return [];

    const prices = validData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return [];

    const priceStep = priceRange / 50; // 50 price levels for detail
    const profile = new Map();
    
    // Initialize all price levels
    for (let i = 0; i < 50; i++) {
      const priceLevel = minPrice + (i * priceStep);
      const key = priceLevel.toFixed(2);
      profile.set(key, {
        price: priceLevel,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        trades: 0
      });
    }
    
    // Distribute volume across price levels
    validData.forEach(candle => {
      const avgPrice = (candle.high + candle.low + candle.close) / 3;
      const levelIndex = Math.round((avgPrice - minPrice) / priceStep);
      const clampedIndex = Math.max(0, Math.min(49, levelIndex));
      const priceLevel = minPrice + (clampedIndex * priceStep);
      const key = priceLevel.toFixed(2);
      
      if (profile.has(key)) {
        const level = profile.get(key);
        level.volume += candle.volume;
        
        // Estimate buy/sell volume based on close vs open
        if (candle.close >= candle.open) {
          level.buyVolume += candle.volume * 0.6;
          level.sellVolume += candle.volume * 0.4;
        } else {
          level.buyVolume += candle.volume * 0.4;
          level.sellVolume += candle.volume * 0.6;
        }
        
        level.trades += 1;
        profile.set(key, level);
      }
    });
    
    return Array.from(profile.values())
      .filter(level => level.volume > 0)
      .sort((a, b) => b.price - a.price);
  }, [data]);

  if (!volumeProfile.length) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/5 rounded-lg border" 
        style={{ width, height }}
      >
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Unable to generate volume profile</p>
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(...volumeProfile.map(level => level.volume));
  const pocLevel = volumeProfile.find(level => level.volume === maxVolume);

  return (
    <div className="relative">
      {/* Volume Profile Legend */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/5 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">Buy Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">Sell Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">POC (Point of Control)</span>
          </div>
        </div>
        <Badge variant="default" size="sm">
          {volumeProfile.length} Price Levels
        </Badge>
      </div>

      {/* Interactive tooltip */}
      {interactive && selectedLevel !== null && volumeProfile[selectedLevel] && (
        <div className="absolute top-16 right-4 bg-popover border border-border rounded-lg p-3 shadow-lg z-10">
          <div className="text-sm font-medium">
            Price Level: ${volumeProfile[selectedLevel].price.toFixed(2)}
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs mt-2">
            <span>Total Volume: {formatVolume(volumeProfile[selectedLevel].volume)}</span>
            <span>Buy Volume: {formatVolume(volumeProfile[selectedLevel].buyVolume)}</span>
            <span>Sell Volume: {formatVolume(volumeProfile[selectedLevel].sellVolume)}</span>
            <span>Trades: {volumeProfile[selectedLevel].trades}</span>
          </div>
        </div>
      )}

      {/* Volume Profile Chart */}
      <div className="space-y-1 max-h-80 overflow-y-auto border rounded-lg p-2">
        {volumeProfile.map((level, index) => {
          const volumePercentage = (level.volume / maxVolume) * 100;
          const buyPercentage = level.volume > 0 ? (level.buyVolume / level.volume) * 100 : 0;
          const isPOC = level.volume === maxVolume;
          const isSelected = selectedLevel === index;

          return (
            <div
              key={`volume-level-${index}`}
              className={cn(
                "flex items-center justify-between p-1 rounded transition-all duration-150",
                interactive && "cursor-pointer hover:bg-muted/20",
                isSelected && "bg-muted/30",
                isPOC && "ring-2 ring-blue-500 ring-opacity-50"
              )}
              onClick={() => interactive && setSelectedLevel(isSelected ? null : index)}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className={cn(
                  "text-xs font-mono w-16 text-right",
                  isPOC && "font-bold text-blue-600"
                )}>
                  ${level.price.toFixed(2)}
                </span>
                
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  {/* Total volume bar */}
                  <div 
                    className="h-full bg-gray-400 relative rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(2, volumePercentage)}%` }}
                  >
                    {/* Buy volume overlay */}
                    <div 
                      className="h-full bg-green-500 rounded-full absolute left-0 top-0"
                      style={{ width: `${buyPercentage}%` }}
                    />
                    {/* Sell volume overlay */}
                    <div 
                      className="h-full bg-red-500 rounded-full absolute right-0 top-0"
                      style={{ width: `${100 - buyPercentage}%` }}
                    />
                  </div>
                </div>

                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatVolume(level.volume)}
                </span>
              </div>

              {isPOC && (
                <Badge variant="default" size="sm" className="ml-2">
                  POC
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Volume Profile Statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/5 rounded-lg">
          <div className="text-xs text-muted-foreground">Point of Control</div>
          <div className="font-semibold">
            ${pocLevel?.price.toFixed(2) || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            Highest volume price
          </div>
        </div>
        <div className="p-3 bg-muted/5 rounded-lg">
          <div className="text-xs text-muted-foreground">Value Area</div>
          <div className="font-semibold">
            70% of volume
          </div>
          <div className="text-xs text-muted-foreground">
            Price range containing most activity
          </div>
        </div>
      </div>
    </div>
  );
};

// 🚀 FIXED: Volume Analysis Component with comprehensive calculations
const VolumeAnalysis: React.FC<{ 
  data: ChartDataPoint[];
  width: number;
  height: number;
}> = ({ data, width, height }) => {
  const volumeStats = useMemo(() => {
    if (!data?.length) return null;

    const validData = data.filter(d => 
      d && 
      typeof d.volume === 'number' && 
      !isNaN(d.volume) && 
      isFinite(d.volume) && 
      d.volume > 0 &&
      typeof d.close === 'number' &&
      typeof d.open === 'number' &&
      !isNaN(d.close) && !isNaN(d.open) &&
      isFinite(d.close) && isFinite(d.open)
    );

    if (!validData.length) return null;

    const volumes = validData.map(d => d.volume);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes);
    
    // Calculate volume trend (last 20 vs previous 20 periods)
    const recentVolumes = volumes.slice(-Math.min(20, volumes.length));
    const previousVolumes = volumes.slice(-Math.min(40, volumes.length), -Math.min(20, volumes.length));
    
    const recentAvg = recentVolumes.length ? 
      recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length : avgVolume;
    const previousAvg = previousVolumes.length ? 
      previousVolumes.reduce((sum, vol) => sum + vol, 0) / previousVolumes.length : avgVolume;
    
    const volumeTrend = previousAvg !== 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    // Volume-price relationship
    const upVolume = validData.filter(d => d.close >= d.open).reduce((sum, d) => sum + d.volume, 0);
    const downVolume = validData.filter(d => d.close < d.open).reduce((sum, d) => sum + d.volume, 0);
    const totalPriceVolume = upVolume + downVolume;
    const buyingPressure = totalPriceVolume > 0 ? (upVolume / totalPriceVolume) * 100 : 50;

    return {
      avgVolume,
      totalVolume,
      maxVolume,
      minVolume,
      volumeTrend,
      buyingPressure,
      upVolume,
      downVolume,
      validDataPoints: validData.length
    };
  }, [data]);

  if (!volumeStats) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/5 rounded-lg border" 
        style={{ width, height }}
      >
        <div className="text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No volume analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Volume Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg Volume</span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{formatVolume(volumeStats.avgVolume)}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Volume Trend</span>
            {volumeStats.volumeTrend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className={cn(
            "text-xl font-bold",
            volumeStats.volumeTrend > 0 ? "text-green-500" : "text-red-500"
          )}>
            {volumeStats.volumeTrend > 0 ? '+' : ''}{volumeStats.volumeTrend.toFixed(1)}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Buying Pressure</span>
            <div className={cn(
              "w-3 h-3 rounded-full",
              volumeStats.buyingPressure > 60 ? "bg-green-500" :
              volumeStats.buyingPressure > 40 ? "bg-yellow-500" : "bg-red-500"
            )} />
          </div>
          <div className="text-xl font-bold">{volumeStats.buyingPressure.toFixed(1)}%</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Volume</span>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{formatVolume(volumeStats.totalVolume)}</div>
        </Card>
      </div>

      {/* Volume Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            Volume Distribution
            <Info className="w-4 h-4 text-muted-foreground" />
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Up Volume:</span>
              <span className="font-medium">{formatVolume(volumeStats.upVolume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-600">Down Volume:</span>
              <span className="font-medium">{formatVolume(volumeStats.downVolume)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${volumeStats.buyingPressure}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Volume Alerts */}
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Volume Alerts</h4>
          <div className="space-y-2">
            {volumeStats.volumeTrend > 50 && (
              <Badge variant="success" className="w-full justify-start">
                High volume increase detected (+{volumeStats.volumeTrend.toFixed(0)}%)
              </Badge>
            )}
            {volumeStats.buyingPressure > 70 && (
              <Badge variant="success" className="w-full justify-start">
                Strong buying pressure ({volumeStats.buyingPressure.toFixed(0)}%)
              </Badge>
            )}
            {volumeStats.buyingPressure < 30 && (
              <Badge variant="destructive" className="w-full justify-start">
                Strong selling pressure ({(100 - volumeStats.buyingPressure).toFixed(0)}%)
              </Badge>
            )}
            {Math.abs(volumeStats.volumeTrend) < 10 && (
              <Badge variant="secondary" className="w-full justify-start">
                Volume trend is neutral
              </Badge>
            )}
            <Badge variant="outline" className="w-full justify-start">
              Data points: {volumeStats.validDataPoints}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 🚀 FIXED: Main Volume Chart Component with comprehensive error handling
const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  width = 800,
  height = 400, // 🚀 INCREASED: More height for better visualization
  showProfile = true,
  interactive = true,
  className
}) => {
  // Validate input data
  const validatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(d => d != null);
  }, [data]);

  // 🚀 ENHANCED: Volume tabs with full-height containers
  const volumeTabs = useMemo(() => [
    {
      id: 'bars',
      label: 'Volume Bars',
      icon: <BarChart3 className="w-4 h-4" />,
      content: (
        // 🚀 FIXED: Full height container for volume bars
        <div className="w-full" style={{ height: `${height}px` }}>
          <VolumeBarChart 
            data={data} 
            width={width} 
            height={height}
            interactive={interactive}
          />
        </div>
      )
    },
    {
      id: 'profile',
      label: 'Volume Profile',
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="w-full" style={{ height: `${height}px` }}>
          <VolumeProfileChart 
            data={data} 
            width={width} 
            height={height}
            interactive={interactive}
          />
        </div>
      )
    },
    {
      id: 'analysis',
      label: 'Volume Analysis',
      icon: <Target className="w-4 h-4" />,
      content: (
        <div className="w-full" style={{ height: `${height}px`, overflow: 'auto' }}>
          <VolumeAnalysis 
            data={data} 
            width={width} 
            height={height}
          />
        </div>
      )
    }
  ], [data, width, height, interactive]);

  return (
    <div className={cn('volume-chart-container w-full h-full bg-transparent', className)}>
      <ProfessionalTabs
        tabs={volumeTabs}
        defaultTab="bars" // 🚀 CHANGED: Default to bars view
        variant="professional"
      />
    </div>
  );
};

export default VolumeChart;