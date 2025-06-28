import type { PriceAlert, TechnicalAlert, AlertNotification } from '../types/alerts';
import { notificationService } from '../services/notificationService';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

interface TechnicalData {
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  volume?: number;
  averageVolume?: number;
  supportLevel?: number;
  resistanceLevel?: number;
}

// 🚀 Check if price alert should trigger
export const checkPriceAlert = (alert: PriceAlert, priceData: PriceData): boolean => {
  if (!alert.isActive || alert.isTriggered) return false;
  if (alert.symbol !== priceData.symbol) return false;

  const { type, condition } = alert;
  const { value, operator } = condition;
  const currentPrice = priceData.price;

  let shouldTrigger = false;

  switch (type) {
    case 'price_above':
      shouldTrigger = currentPrice > value;
      break;
    
    case 'price_below':
      shouldTrigger = currentPrice < value;
      break;
    
    case 'percent_change':
      const absChange = Math.abs(priceData.changePercent);
      shouldTrigger = operator === 'greater_than' ? absChange > value : absChange < value;
      break;
    
    case 'volume_spike':
      // Assuming value is the multiplier (e.g., 2x, 3x average volume)
      const volumeRatio = priceData.volume / (priceData.volume / value); // Simplified
      shouldTrigger = volumeRatio >= value;
      break;
  }

  if (shouldTrigger) {
    triggerPriceAlert(alert, priceData);
  }

  return shouldTrigger;
};

// 🚀 Check if technical alert should trigger
export const checkTechnicalAlert = (alert: TechnicalAlert, technicalData: TechnicalData): boolean => {
  if (!alert.isActive || alert.isTriggered) return false;

  const { type, parameters } = alert;
  let shouldTrigger = false;

  switch (type) {
    case 'rsi_overbought':
      shouldTrigger = (technicalData.rsi ?? 50) > (parameters.rsiLevel ?? 70);
      break;
    
    case 'rsi_oversold':
      shouldTrigger = (technicalData.rsi ?? 50) < (parameters.rsiLevel ?? 30);
      break;
    
    case 'macd_crossover':
      if (technicalData.macd) {
        const { macd, signal } = technicalData.macd;
        shouldTrigger = macd > signal; // Bullish crossover
      }
      break;
    
    case 'support_break':
      shouldTrigger = (technicalData.supportLevel ?? 0) > 0;
      break;
    
    case 'resistance_break':
      shouldTrigger = (technicalData.resistanceLevel ?? 0) > 0;
      break;
    
    case 'volume_breakout':
      if (technicalData.volume && technicalData.averageVolume) {
        const ratio = technicalData.volume / technicalData.averageVolume;
        shouldTrigger = ratio >= (parameters.volumeMultiplier ?? 2);
      }
      break;
  }

  if (shouldTrigger) {
    triggerTechnicalAlert(alert, technicalData);
  }

  return shouldTrigger;
};

// 🚀 Trigger price alert notification
const triggerPriceAlert = (alert: PriceAlert, priceData: PriceData) => {
  const { notificationSettings, message, priority } = alert;

  // Update alert metadata
  alert.metadata = {
    currentPrice: priceData.price,
    triggerPrice: alert.condition.value,
    percentChange: priceData.changePercent
  };

  // Show browser notification
  if (notificationSettings.browser) {
    if (alert.type === 'price_above' || alert.type === 'price_below') {
      const type = alert.type === 'price_above' ? 'above' : 'below';
      notificationService.showPriceAlert(
        alert.symbol,
        priceData.price,
        alert.condition.value,
        type
      );
    } else {
      notificationService.showNotification(`📈 ${alert.symbol} Alert`, {
        body: message,
        priority: priority as any,
        data: alert
      });
    }
  }

  // Play sound
  if (notificationSettings.sound) {
    const soundType = priority === 'critical' ? 'critical' : 
                     priority === 'high' ? 'warning' : 'info';
    notificationService.playAlertSound(soundType as any);
  }

  // Mark as triggered
  alert.isTriggered = true;
  alert.triggeredAt = new Date();

  console.log(`🚨 Price alert triggered for ${alert.symbol}:`, alert);
};

// 🚀 Trigger technical alert notification
const triggerTechnicalAlert = (alert: TechnicalAlert, technicalData: TechnicalData) => {
  const { notificationSettings, message, priority } = alert;

  // Show browser notification
  if (notificationSettings.browser) {
    notificationService.showTechnicalAlert(
      alert.symbol,
      alert.type.replace('_', ' ').toUpperCase(),
      message,
      priority as any
    );
  }

  // Play sound
  if (notificationSettings.sound) {
    const soundType = priority === 'critical' ? 'critical' : 
                     priority === 'high' ? 'warning' : 'info';
    notificationService.playAlertSound(soundType as any);
  }

  // Mark as triggered
  alert.isTriggered = true;
  alert.triggeredAt = new Date();

  console.log(`🚨 Technical alert triggered for ${alert.symbol}:`, alert);
};

// 🚀 Create alert notification object
export const createAlertNotification = (
  alertId: string,
  title: string,
  message: string,
  type: 'price' | 'technical' | 'news' | 'system',
  priority: 'low' | 'medium' | 'high' | 'critical',
  data?: any
): AlertNotification => {
  return {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    alertId,
    title,
    message,
    type,
    priority,
    timestamp: new Date(),
    isRead: false,
    data
  };
};

// 🚀 Calculate RSI (simplified)
export const calculateRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// 🚀 Detect support and resistance levels
export const detectSupportResistance = (prices: number[], window = 20): {
  support: number[];
  resistance: number[];
} => {
  const support: number[] = [];
  const resistance: number[] = [];

  for (let i = window; i < prices.length - window; i++) {
    const current = prices[i];
    const leftWindow = prices.slice(i - window, i);
    const rightWindow = prices.slice(i + 1, i + window + 1);

    // Check for local minimum (support)
    const isLocalMin = leftWindow.every(p => p >= current) && 
                      rightWindow.every(p => p >= current);
    
    // Check for local maximum (resistance)
    const isLocalMax = leftWindow.every(p => p <= current) && 
                      rightWindow.every(p => p <= current);

    if (isLocalMin) support.push(current);
    if (isLocalMax) resistance.push(current);
  }

  return { support, resistance };
};

// 🚀 Generate smart alert suggestions
export const generateAlertSuggestions = (symbol: string, priceData: PriceData, technicalData: TechnicalData): Partial<PriceAlert>[] => {
  const suggestions: Partial<PriceAlert>[] = [];
  const currentPrice = priceData.price;

  // Support/Resistance suggestions
  if (technicalData.supportLevel) {
    suggestions.push({
      symbol,
      type: 'price_below',
      condition: { value: technicalData.supportLevel, operator: 'less_than' },
      message: `${symbol} broke below support level at $${technicalData.supportLevel}`,
      priority: 'high'
    });
  }

  if (technicalData.resistanceLevel) {
    suggestions.push({
      symbol,
      type: 'price_above',
      condition: { value: technicalData.resistanceLevel, operator: 'greater_than' },
      message: `${symbol} broke above resistance level at $${technicalData.resistanceLevel}`,
      priority: 'high'
    });
  }

  // Price movement suggestions
  const fivePercentUp = currentPrice * 1.05;
  const fivePercentDown = currentPrice * 0.95;

  suggestions.push({
    symbol,
    type: 'price_above',
    condition: { value: fivePercentUp, operator: 'greater_than' },
    message: `${symbol} gained 5% or more`,
    priority: 'medium'
  });

  suggestions.push({
    symbol,
    type: 'price_below',
    condition: { value: fivePercentDown, operator: 'less_than' },
    message: `${symbol} dropped 5% or more`,
    priority: 'medium'
  });

  // Volume spike suggestion
  if (technicalData.averageVolume) {
    suggestions.push({
      symbol,
      type: 'volume_spike',
      condition: { value: 2, operator: 'greater_than' },
      message: `${symbol} volume spike detected (2x average)`,
      priority: 'medium'
    });
  }

  return suggestions;
};