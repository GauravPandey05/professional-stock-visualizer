export type ChartType = 'candlestick' | 'line' | 'area' | 'ohlc' | 'heikin-ashi';

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface ProcessedChartData {
  data: ChartDataPoint[];
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  totalPoints: number;
}

export interface VolumeProfileData {
  price: number;
  volume: number;
  percentage: number;
  pocLevel?: boolean; // Point of Control (highest volume level)
  valueAreaHigh?: boolean;
  valueAreaLow?: boolean;
}

export interface SupportResistanceLevel {
  id: string;
  price: number;
  strength: number; // 0-1 scale (0=weak, 1=very strong)
  type: 'support' | 'resistance';
  touches: number;
  lastTouch: string;
  confidence: number; // Statistical confidence in the level
}

export interface ChartPattern {
  id: string;
  type: 'triangle' | 'channel' | 'flag' | 'pennant' | 'head-shoulders' | 'double-top' | 'double-bottom' | 'cup-handle';
  confidence: number; // 0-1 confidence score
  startDate: string;
  endDate: string;
  points: Array<{ time: string; price: number; role: 'peak' | 'trough' | 'breakout' }>;
  description: string;
  bullish: boolean;
  target?: number; // Price target if pattern completes
  stopLoss?: number; // Suggested stop loss level
}

export interface TrendLine {
  id: string;
  points: Array<{ time: string; price: number }>;
  slope: number;
  strength: number; // Number of touches
  type: 'uptrend' | 'downtrend' | 'sideways';
  extended: boolean;
  r2: number; // R-squared correlation coefficient
  active: boolean; // Whether the trend is still valid
}

export interface ChartSettings {
  type: ChartType;
  timeframe: Timeframe;
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  priceScale: 'normal' | 'logarithmic';
  theme: 'light' | 'dark' | 'professional';
  candleStyle: 'traditional' | 'hollow' | 'heikin-ashi';
  volumeStyle: 'bars' | 'area' | 'profile';
  showSupportResistance: boolean;
  showTrendLines: boolean;
  showPatterns: boolean;
}

export interface ChartAnnotation {
  id: string;
  type: 'line' | 'rectangle' | 'text' | 'arrow' | 'fibonacci';
  coordinates: {
    x1: string | number;
    y1: number;
    x2?: string | number;
    y2?: number;
  };
  style: {
    color: string;
    width?: number;
    opacity?: number;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
  };
  text?: string;
  draggable?: boolean;
  visible: boolean;
}

export interface FibonacciRetracement {
  id: string;
  startPoint: { time: string; price: number };
  endPoint: { time: string; price: number };
  levels: Array<{
    percentage: number;
    price: number;
    label: string;
  }>;
  direction: 'uptrend' | 'downtrend';
}

export interface ChartEvent {
  type: 'click' | 'hover' | 'zoom' | 'pan' | 'crosshair';
  data: {
    time?: string;
    price?: number;
    point?: ChartDataPoint;
    x?: number;
    y?: number;
  };
}

export interface MarketSession {
  name: string;
  start: string; // Time in HH:mm format
  end: string;
  timezone: string;
  color: string;
  active: boolean;
}

export interface ChartAlert {
  id: string;
  type: 'price' | 'volume' | 'indicator' | 'pattern';
  condition: 'above' | 'below' | 'crosses_up' | 'crosses_down' | 'equals';
  value: number;
  message: string;
  active: boolean;
  triggered: boolean;
  createdAt: string;
}