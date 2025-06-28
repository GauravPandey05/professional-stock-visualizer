export interface PriceData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RiskMetrics {
  var95: number;          // Value at Risk (95% confidence)
  var99: number;          // Value at Risk (99% confidence)
  sharpeRatio: number;    // Risk-adjusted return measure
  maxDrawdown: number;    // Maximum peak-to-trough decline
  beta: number;           // Market correlation coefficient
  volatility: number;     // Annualized volatility
  informationRatio: number; // Active return vs tracking error
  sortinoRatio: number;   // Downside deviation adjusted return
  calmarRatio: number;    // Annual return vs max drawdown
}

export interface QuantitativeMetrics {
  returns: number[];        // Daily returns array
  cumulativeReturns: number[]; // Cumulative return series
  rollingVolatility: number[]; // 30-day rolling volatility
  drawdownSeries: number[];    // Historical drawdown series
  riskMetrics: RiskMetrics;
  correlationData?: {
    symbol: string;
    correlation: number;
  }[];
}

export interface FundamentalData {
  peRatio: number;
  pbRatio: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  marketCap: number;
  dividendYield: number;
  beta: number;
  eps: number;
}

export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  prices: PriceData[];
  quantMetrics?: QuantitativeMetrics;
  fundamentals?: FundamentalData;
  sector: string;
  marketCap: number;
  volume: number;
  avgVolume: number;
  high52Week: number;
  low52Week: number;
}

export interface TechnicalIndicator {
  name: string;
  enabled: boolean;
  color: string;
  type: 'overlay' | 'oscillator';
  data?: number[];
  params?: Record<string, number>;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  portfolioRisk: RiskMetrics;
  positions: PortfolioPosition[];
  assetAllocation: {
    symbol: string;
    weight: number;
    value: number;
  }[];
  diversificationRatio: number;
  sharpeRatio: number;
}

export interface MarketData {
  sp500: number;
  nasdaq: number;
  dow: number;
  vix: number;
  treasuryRate: number;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}