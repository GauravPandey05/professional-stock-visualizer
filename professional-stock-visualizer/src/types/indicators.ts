export type IndicatorType = 
  | 'sma' | 'ema' | 'wma' | 'bollinger' | 'rsi' | 'macd' | 'stochastic' 
  | 'williams_r' | 'cci' | 'atr' | 'adx' | 'obv' | 'vwap' | 'pivot_points'
  | 'ichimoku' | 'parabolic_sar' | 'fibonacci';

export type IndicatorCategory = 'trend' | 'momentum' | 'volume' | 'volatility' | 'support_resistance';

export interface BaseIndicator {
  id: string;
  name: string;
  type: IndicatorType;
  category: IndicatorCategory;
  enabled: boolean;
  visible: boolean;
  displayType: 'overlay' | 'separate_panel';
  zIndex: number;
}

export interface MovingAverageIndicator extends BaseIndicator {
  type: 'sma' | 'ema' | 'wma';
  params: {
    period: number;
    source: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  };
  style: {
    color: string;
    width: number;
    opacity: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
  };
  data: Array<{ time: string; value: number | null }>;
}

export interface BollingerBandsIndicator extends BaseIndicator {
  type: 'bollinger';
  params: {
    period: number;
    stdDev: number;
    source: 'close' | 'open' | 'high' | 'low';
  };
  style: {
    upperColor: string;
    lowerColor: string;
    middleColor: string;
    fillColor: string;
    fillOpacity: number;
    width: number;
  };
  data: Array<{
    time: string;
    upper: number | null;
    middle: number | null;
    lower: number | null;
  }>;
}

export interface RSIIndicator extends BaseIndicator {
  type: 'rsi';
  displayType: 'separate_panel';
  params: {
    period: number;
    overbought: number;
    oversold: number;
  };
  style: {
    lineColor: string;
    overboughtColor: string;
    oversoldColor: string;
    fillColor: string;
    width: number;
  };
  data: Array<{ time: string; value: number | null }>;
}

export interface MACDIndicator extends BaseIndicator {
  type: 'macd';
  displayType: 'separate_panel';
  params: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    source: 'close' | 'open' | 'high' | 'low';
  };
  style: {
    macdColor: string;
    signalColor: string;
    histogramPositiveColor: string;
    histogramNegativeColor: string;
    width: number;
  };
  data: Array<{
    time: string;
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  }>;
}

export interface StochasticIndicator extends BaseIndicator {
  type: 'stochastic';
  displayType: 'separate_panel';
  params: {
    kPeriod: number;
    dPeriod: number;
    smooth: number;
    overbought: number;
    oversold: number;
  };
  style: {
    kColor: string;
    dColor: string;
    overboughtColor: string;
    oversoldColor: string;
    width: number;
  };
  data: Array<{
    time: string;
    k: number | null;
    d: number | null;
  }>;
}

export interface VWAPIndicator extends BaseIndicator {
  type: 'vwap';
  params: {
    anchorType: 'session' | 'week' | 'month' | 'custom';
    customAnchor?: string;
  };
  style: {
    color: string;
    width: number;
    opacity: number;
  };
  data: Array<{ time: string; value: number | null }>;
}

export interface IchimokuIndicator extends BaseIndicator {
  type: 'ichimoku';
  params: {
    conversionPeriod: number;
    basePeriod: number;
    laggingSpan2Period: number;
    displacement: number;
  };
  style: {
    conversionLineColor: string;
    baseLineColor: string;
    leadingSpan1Color: string;
    leadingSpan2Color: string;
    laggingSpanColor: string;
    cloudUpColor: string;
    cloudDownColor: string;
    width: number;
  };
  data: Array<{
    time: string;
    conversionLine: number | null;
    baseLine: number | null;
    leadingSpan1: number | null;
    leadingSpan2: number | null;
    laggingSpan: number | null;
  }>;
}

export interface ATRIndicator extends BaseIndicator {
  type: 'atr';
  displayType: 'separate_panel';
  params: {
    period: number;
  };
  style: {
    color: string;
    width: number;
  };
  data: Array<{ time: string; value: number | null }>;
}

export interface VolumeIndicator extends BaseIndicator {
  type: 'obv';
  displayType: 'separate_panel';
  params: {
    showAverage: boolean;
    averagePeriod: number;
  };
  style: {
    upColor: string;
    downColor: string;
    averageColor: string;
    width: number;
  };
  data: Array<{
    time: string;
    obv: number | null;
    average?: number | null;
  }>;
}

export interface PivotPointsIndicator extends BaseIndicator {
  type: 'pivot_points';
  params: {
    timeframe: 'daily' | 'weekly' | 'monthly';
    showLevels: boolean;
    showMidpoints: boolean;
  };
  style: {
    pivotColor: string;
    supportColors: string[];
    resistanceColors: string[];
    width: number;
    lineStyle: 'solid' | 'dashed';
  };
  data: Array<{
    time: string;
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  }>;
}

export type AnyIndicator = 
  | MovingAverageIndicator
  | BollingerBandsIndicator
  | RSIIndicator
  | MACDIndicator
  | StochasticIndicator
  | VWAPIndicator
  | IchimokuIndicator
  | ATRIndicator
  | VolumeIndicator
  | PivotPointsIndicator;

export interface IndicatorPreset {
  id: string;
  name: string;
  description: string;
  indicators: AnyIndicator[];
  category: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

export interface IndicatorSignal {
  type: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-1
  indicator: IndicatorType;
  message: string;
  timestamp: string;
  price: number;
  confidence: number;
}

export interface IndicatorAlert {
  id: string;
  indicatorId: string;
  condition: string;
  value: number;
  message: string;
  active: boolean;
}