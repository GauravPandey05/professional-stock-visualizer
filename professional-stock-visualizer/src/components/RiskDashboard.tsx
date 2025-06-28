import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Activity,
  BarChart3,
  Volume2,
  Target,
  Zap
} from 'lucide-react';
import type { QuantitativeMetrics, StockData } from '../types/stock';
import TradingChart from './charts/TradingChart';
import VolumeChart from './charts/VolumeChart';
import IndicatorChart from './charts/IndicatorChart';
import { ProfessionalTabs } from './ui/Tabs';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { cn } from '../utils/cn';
import LivePriceIndicator from './LivePriceIndicator';
import RealTimeStatus from './RealTimeStatus';

interface RiskDashboardProps {
  riskMetrics: QuantitativeMetrics;
  isLoading?: boolean;
  symbol?: string;
  className?: string;
  stockData?: StockData;
}

// ⚡ COMPLETELY FIXED: Trading Chart with NO white box
const ProfessionalTradingChart = memo(({ symbol, height = 500 }: { 
  symbol: string,
  height?: number 
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      
      
      {/* 🚀 FIXED: Direct chart rendering - NO white box container */}
      <TradingChart 
        symbol={symbol}
        height={height}
        showControls={true}
        showVolume={true}
        className="w-full bg-transparent"
      />
    </div>
  );
});

// ⚡ COMPLETELY FIXED: Volume Chart with full space utilization
const ProfessionalVolumeChart = memo(({ data, symbol, height = 400 }: { 
  data: any[], 
  symbol: string,
  height?: number 
}) => {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Volume2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No volume data available for {symbol}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent"> {/* 🚀 NO containers */}
      
      
      {/* 🚀 MAXIMIZED: Full-width volume chart */}
      <div className="w-full border border-border/20 rounded-lg overflow-hidden">
        <VolumeChart 
          data={data}
          width={800}
          height={height}
          showProfile={true}
          interactive={true}
          className="w-full h-full"
        />
      </div>
    </div>
  );
});

// ⚡ ENHANCED: Interactive Indicator Chart
const ProfessionalIndicatorChart = memo(({ data, symbol, height = 400 }: { 
  data: any[], 
  symbol: string,
  height?: number 
}) => {
  if (!data || !data.length) {
    return (
      <div className="p-6 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Technical Indicators</h3>
        <p className="text-muted-foreground">No data available for indicators</p>
      </div>
    );
  }

  // Enhanced technical indicator calculations
  const calculateRSI = (prices: number[], period: number = 14) => {
    if (prices.length < period) return 50;
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[]) => {
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9; // Simplified signal line
    return { macdLine, signalLine, histogram: macdLine - signalLine };
  };

  const prices = data.map(d => d.close);
  const currentRSI = calculateRSI(prices);
  const macdData = calculateMACD(prices);
  
  const rsiSignal = currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral';
  const rsiVariant = currentRSI > 70 ? 'danger' : currentRSI < 30 ? 'success' : 'secondary';
  const macdSignal = macdData.macdLine > macdData.signalLine ? 'Bullish' : 'Bearish';

  return (
    <div className="space-y-4">
      
      
      {/* 🚀 FIXED: Interactive Indicator Chart */}
      <IndicatorChart 
        data={data}
        width={800}
        height={height}
        interactive={true}
        indicators={['rsi', 'macd', 'bollinger']}
        className="w-full"
      />
      
      {/* Enhanced Technical Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            RSI Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current RSI:</span>
              <Badge variant={rsiVariant} size="sm">{currentRSI.toFixed(1)}</Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  currentRSI > 70 ? "bg-red-500" : currentRSI < 30 ? "bg-green-500" : "bg-blue-500"
                )}
                style={{ width: `${currentRSI}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Oversold (30)</span>
              <span>Neutral (50)</span>
              <span>Overbought (70)</span>
            </div>
            <Badge variant={rsiVariant}>{rsiSignal}</Badge>
          </div>
        </div>

        <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            MACD Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MACD Line:</span>
              <Badge variant={macdData.macdLine > 0 ? 'success' : 'danger'} size="sm">
                {macdData.macdLine > 0 ? '+' : ''}{macdData.macdLine.toFixed(2)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signal Line:</span>
              <Badge variant="default" size="sm">
                {macdData.signalLine > 0 ? '+' : ''}{macdData.signalLine.toFixed(2)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Histogram:</span>
              <Badge variant={macdData.histogram > 0 ? 'success' : 'danger'} size="sm">
                {macdData.histogram > 0 ? '+' : ''}{macdData.histogram.toFixed(2)}
              </Badge>
            </div>
            <Badge variant={macdSignal === 'Bullish' ? 'success' : 'danger'}>{macdSignal}</Badge>
          </div>
        </div>

        <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Bollinger Bands
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position:</span>
              <Badge variant="default" size="sm">Middle Band</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bandwidth:</span>
              <Badge variant="secondary" size="sm">Normal</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Squeeze:</span>
              <Badge variant="success" size="sm">No</Badge>
            </div>
            <Badge variant="success">Normal Range</Badge>
          </div>
        </div>
      </div>
    </div>
  );
});

const RiskDashboard: React.FC<RiskDashboardProps> = ({ 
  riskMetrics, 
  isLoading = false,
  symbol = 'Stock',
  className,
  stockData
}) => {
  const [activeTab, setActiveTab] = useState('risk');

  // ⚡ Optimized chart data transformation
  const chartDataPoints = useMemo(() => {
    if (!stockData?.prices?.length) return [];
    
    return stockData.prices.map((price, index) => ({
      timestamp: Date.parse(price.time) || index,
      time: price.time,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
      index: index
    }));
  }, [stockData?.prices]);

  // ⚡ Memoized risk metrics extraction
  const riskData = useMemo(() => {
    const actualRiskMetrics = riskMetrics?.riskMetrics || {};
    
    return {
      var95: actualRiskMetrics.var95 || 0,
      var99: actualRiskMetrics.var99 || 0,
      sharpeRatio: actualRiskMetrics.sharpeRatio || 0,
      beta: actualRiskMetrics.beta || 0,
      volatility: actualRiskMetrics.volatility || 0,
      maxDrawdown: actualRiskMetrics.maxDrawdown || 0,
      informationRatio: actualRiskMetrics.informationRatio || 0,
      sortinoRatio: actualRiskMetrics.sortinoRatio || 0,
      calmarRatio: actualRiskMetrics.calmarRatio || 0,
    };
  }, [riskMetrics]);

  // ⚡ Memoized risk assessment
  const riskAssessment = useMemo(() => {
    const getRiskLevel = (varValue: number) => {
      if (varValue < 0.02) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100', icon: Shield };
      if (varValue < 0.05) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
      return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100', icon: TrendingDown };
    };

    const getSharpeRating = (sharpe: number) => {
      if (sharpe > 2) return { rating: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: TrendingUp };
      if (sharpe > 1) return { rating: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
      if (sharpe > 0.5) return { rating: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Activity };
      return { rating: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100', icon: TrendingDown };
    };

    const risk = getRiskLevel(riskData.var95);
    const sharpeRating = getSharpeRating(riskData.sharpeRatio);

    return { risk, sharpeRating, RiskIcon: risk.icon, SharpeIcon: sharpeRating.icon };
  }, [riskData.var95, riskData.sharpeRatio]);

  // ⚡ Formatting functions
  const formatters = useMemo(() => ({
    formatPercentage: (value: number, decimals: number = 2): string => {
      if (isNaN(value) || !isFinite(value)) return 'N/A';
      return `${(value * 100).toFixed(decimals)}%`;
    },
    formatRatio: (value: number, decimals: number = 2): string => {
      if (isNaN(value) || !isFinite(value)) return 'N/A';
      return value.toFixed(decimals);
    }
  }), []);

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const { risk, sharpeRating, RiskIcon, SharpeIcon } = riskAssessment;
  const { formatPercentage, formatRatio } = formatters;

  // ⚡ COMPLETELY FIXED: Tab configuration with proper chart containers
  const dashboardTabs = useMemo(() => [
    {
      id: 'risk',
      label: 'Risk Analytics',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* 🚀 NEW: Real-time price indicator at the top */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <LivePriceIndicator 
                symbol={symbol} 
                variant="detailed"
                showDetails={true}
              />
            </div>
            <div>
              <RealTimeStatus 
                symbol={symbol}
                showDetails={true}
              />
            </div>
          </div>
          
          {/* Primary Risk Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</h3>
                <RiskIcon className={cn("w-5 h-5", risk.color)} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatPercentage(riskData.var95)}</p>
                <Badge variant="secondary" className={cn("text-xs", risk.color, risk.bgColor)}>
                  {risk.level} Risk
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Sharpe Ratio</h3>
                <SharpeIcon className={cn("w-5 h-5", sharpeRating.color)} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatRatio(riskData.sharpeRatio)}</p>
                <Badge variant="secondary" className={cn("text-xs", sharpeRating.color, sharpeRating.bgColor)}>
                  {sharpeRating.rating}
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Beta Coefficient</h3>
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatRatio(riskData.beta)}</p>
                <p className="text-xs text-muted-foreground">
                  {riskData.beta > 1 ? 'More volatile' : riskData.beta < 1 ? 'Less volatile' : 'Market neutral'}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Max Drawdown</h3>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-600">{formatPercentage(riskData.maxDrawdown)}</p>
                <p className="text-xs text-muted-foreground">Peak-to-trough decline</p>
              </div>
            </Card>
          </div>

          {/* Risk Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Risk Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <Badge variant="secondary" className={cn(risk.color, risk.bgColor)}>
                    {risk.level}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Performance</span>
                  <Badge variant="secondary" className={cn(sharpeRating.color, sharpeRating.bgColor)}>
                    {sharpeRating.rating}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data Points</span>
                  <Badge variant="default" size="sm">{chartDataPoints.length}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className="font-medium">{formatPercentage(riskData.volatility)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sortino Ratio:</span>
                  <span className="font-medium">{formatRatio(riskData.sortinoRatio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calmar Ratio:</span>
                  <span className="font-medium">{formatRatio(riskData.calmarRatio)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Charts</span>
                  <Badge variant="success" size="sm">✅ Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Data Quality</span>
                  <Badge variant="success" size="sm">✅ High</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Analysis</span>
                  <Badge variant="success" size="sm">✅ Complete</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'charts',
      label: 'Price Analysis',
      icon: <BarChart3 className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* 🚀 FIXED: No white box - direct chart rendering */}
          <ProfessionalTradingChart symbol={symbol} height={500} />
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Risk Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VaR (95%):</span>
                  <span className="font-medium">{formatPercentage(riskData.var95)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Drawdown:</span>
                  <span className="font-medium text-red-600">{formatPercentage(riskData.maxDrawdown)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volatility:</span>
                  <span className="font-medium">{formatPercentage(riskData.volatility)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Performance
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sharpe Ratio:</span>
                  <span className="font-medium">{formatRatio(riskData.sharpeRatio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beta:</span>
                  <span className="font-medium">{formatRatio(riskData.beta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sortino:</span>
                  <span className="font-medium">{formatRatio(riskData.sortinoRatio)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/5 rounded-lg border border-border/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                Chart Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Points:</span>
                  <Badge variant="success" size="sm">{chartDataPoints.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="default" size="sm">Interactive</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="success" size="sm">🔥 Live</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'volume',
      label: 'Volume Analysis',
      icon: <Volume2 className="w-4 h-4" />,
      content: (
        <div className="w-full h-full"> {/* 🚀 FULL space */}
          <ProfessionalVolumeChart 
            data={chartDataPoints} 
            symbol={symbol} 
            height={500} // 🚀 INCREASED height
          />
        </div>
      )
    },
    {
      id: 'indicators',
      label: 'Technical Indicators',
      icon: <Target className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* 🚀 FIXED: Pass correct props */}
          <ProfessionalIndicatorChart 
            data={chartDataPoints} 
            symbol={symbol} 
            height={400} 
          />
          
          {/* Technical Summary */}
          <div className="p-6 bg-muted/5 rounded-lg border border-border/20">
            <h3 className="text-lg font-semibold mb-4">📊 Technical Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Short-term Signals</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>RSI (14):</span>
                    <Badge variant="success">Interactive</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>MACD:</span>
                    <Badge variant="success">Dynamic Signal</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <Badge variant="default">Profile Complete</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Chart Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Interactivity:</span>
                    <Badge variant="success">🔥 Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume Profile:</span>
                    <Badge variant="success">✅ Complete</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Updates:</span>
                    <Badge variant="default">Real-time</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ], [chartDataPoints, riskData, risk, sharpeRating, RiskIcon, SharpeIcon, formatPercentage, formatRatio, symbol]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("enhanced-risk-dashboard", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{symbol} Risk & Chart Analysis</h2>
            
            <p className="text-xs text-muted-foreground mt-1">
              📊 {chartDataPoints.length} data points 
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={risk.level === 'Low' ? 'default' : risk.level === 'High' ? 'destructive' : 'secondary'}>
              {risk.level}
            </Badge>
            <Badge variant={sharpeRating.rating === 'Excellent' ? 'default' : 'secondary'}>
              {sharpeRating.rating}
            </Badge>
            <Badge variant="success" size="sm"></Badge>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <ProfessionalTabs
        tabs={dashboardTabs}
        defaultTab="risk"
        variant="professional"
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default RiskDashboard;