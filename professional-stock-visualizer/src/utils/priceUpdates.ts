interface PriceUpdate {
  symbol: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface PriceAnimation {
  type: 'increase' | 'decrease' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
  duration: number;
}

// 🚀 Calculate price change significance
export const calculateChangeSignificance = (changePercent: number): PriceAnimation['intensity'] => {
  const absChange = Math.abs(changePercent);
  
  if (absChange >= 2) return 'high';
  if (absChange >= 0.5) return 'medium';
  return 'low';
};

// 🚀 Get price animation config
export const getPriceAnimation = (update: PriceUpdate): PriceAnimation => {
  const changeType = update.change > 0 ? 'increase' : 
                    update.change < 0 ? 'decrease' : 'neutral';
  
  const intensity = calculateChangeSignificance(update.changePercent);
  
  const duration = intensity === 'high' ? 2000 : 
                  intensity === 'medium' ? 1500 : 1000;

  return { type: changeType, intensity, duration };
};

// 🚀 Format price with appropriate decimal places
export const formatPrice = (price: number, symbol?: string): string => {
  if (isNaN(price) || !isFinite(price)) return '---.--';
  
  // Different formatting for different asset types
  if (symbol?.includes('BTC') || symbol?.includes('ETH')) {
    return price.toFixed(2); // Crypto typically 2 decimals
  }
  
  if (price >= 1000) {
    return price.toFixed(2);
  } else if (price >= 100) {
    return price.toFixed(2);
  } else if (price >= 10) {
    return price.toFixed(3);
  } else {
    return price.toFixed(4);
  }
};

// 🚀 Format price change with color coding
export const formatPriceChange = (change: number, changePercent: number) => {
  const formattedChange = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  const formattedPercent = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  
  const colorClass = change > 0 ? 'text-green-600' : 
                    change < 0 ? 'text-red-600' : 'text-gray-600';
  
  return {
    change: formattedChange,
    percent: formattedPercent,
    colorClass,
    isPositive: change >= 0
  };
};

// 🚀 Calculate volume change significance
export const calculateVolumeSignificance = (currentVolume: number, averageVolume: number): string => {
  if (!averageVolume || averageVolume === 0) return 'Unknown';
  
  const ratio = currentVolume / averageVolume;
  
  if (ratio >= 3) return 'Extremely High';
  if (ratio >= 2) return 'Very High';
  if (ratio >= 1.5) return 'High';
  if (ratio >= 0.8) return 'Normal';
  if (ratio >= 0.5) return 'Low';
  return 'Very Low';
};

// 🚀 Price level detection
export const detectPriceLevel = (price: number, dayHigh: number, dayLow: number): string => {
  const range = dayHigh - dayLow;
  if (range === 0) return 'Unchanged';
  
  const position = (price - dayLow) / range;
  
  if (position >= 0.9) return 'Near High';
  if (position >= 0.7) return 'Upper Range';
  if (position >= 0.3) return 'Mid Range';
  if (position >= 0.1) return 'Lower Range';
  return 'Near Low';
};

// 🚀 Generate price alerts
export const generatePriceAlert = (update: PriceUpdate, thresholds: { support?: number; resistance?: number }): string | null => {
  const { price, changePercent } = update;
  
  // Significant movement alert
  if (Math.abs(changePercent) >= 5) {
    return `${update.symbol} has moved ${changePercent.toFixed(2)}% in the last update!`;
  }
  
  // Support/resistance level alerts
  if (thresholds.support && price <= thresholds.support) {
    return `${update.symbol} has touched support level at $${thresholds.support}`;
  }
  
  if (thresholds.resistance && price >= thresholds.resistance) {
    return `${update.symbol} has reached resistance level at $${thresholds.resistance}`;
  }
  
  return null;
};

// 🚀 Calculate momentum indicators
export const calculateMomentum = (priceHistory: number[]): {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  rsi: number;
} => {
  if (priceHistory.length < 14) {
    return { trend: 'neutral', strength: 'weak', rsi: 50 };
  }
  
  // Simple RSI calculation
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < priceHistory.length; i++) {
    const change = priceHistory[i] - priceHistory[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  const trend = rsi > 70 ? 'bullish' : rsi < 30 ? 'bearish' : 'neutral';
  const strength = rsi > 80 || rsi < 20 ? 'strong' : 
                  rsi > 60 || rsi < 40 ? 'moderate' : 'weak';
  
  return { trend, strength, rsi };
};

// 🚀 Format volume for display
export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toString();
};

// 🚀 Time formatting utilities
export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};