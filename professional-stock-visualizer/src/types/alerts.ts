export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'percent_change' | 'volume_spike';
  condition: {
    value: number;
    operator: 'greater_than' | 'less_than' | 'equal_to';
    timeframe?: '1m' | '5m' | '15m' | '1h' | '1d';
  };
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationSettings: {
    browser: boolean;
    sound: boolean;
    email?: boolean;
    push?: boolean;
  };
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    currentPrice?: number;
    triggerPrice?: number;
    percentChange?: number;
  };
}

export interface TechnicalAlert {
  id: string;
  symbol: string;
  type: 'rsi_overbought' | 'rsi_oversold' | 'macd_crossover' | 'support_break' | 'resistance_break' | 'volume_breakout';
  parameters: {
    rsiLevel?: number;
    supportLevel?: number;
    resistanceLevel?: number;
    volumeMultiplier?: number;
  };
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationSettings: {
    browser: boolean;
    sound: boolean;
    email?: boolean;
    push?: boolean;
  };
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NewsAlert {
  id: string;
  keywords: string[];
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'any';
  isActive: boolean;
  createdAt: Date;
  notificationSettings: {
    browser: boolean;
    sound: boolean;
    email?: boolean;
    push?: boolean;
  };
  message: string; // ADDED: Missing message property
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertNotification {
  id: string;
  alertId: string;
  title: string;
  message: string;
  type: 'price' | 'technical' | 'news' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  data?: any;
}

export interface AlertState {
  priceAlerts: PriceAlert[];
  technicalAlerts: TechnicalAlert[];
  newsAlerts: NewsAlert[];
  notifications: AlertNotification[];
  settings: {
    browserNotifications: boolean;
    soundEnabled: boolean;
    emailNotifications: boolean;
    maxNotifications: number;
  };
}

export type AlertType = 'price' | 'technical' | 'news';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';