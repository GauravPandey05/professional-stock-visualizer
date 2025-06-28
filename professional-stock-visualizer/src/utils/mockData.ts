import type { StockData, PriceData, FundamentalData } from '../types/stock';

// Generate realistic market returns with volatility clustering
export const generateMarketReturns = (days: number = 252, seed?: number): number[] => {
  // Use seed for reproducible results in development
  const random = seed !== undefined ? (() => {
    let currentSeed = seed;
    return () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
  })() : Math.random;

  const returns: number[] = [];
  let volatilityRegime = 0.15; // Base volatility (15%)
  
  for (let i = 0; i < days; i++) {
    // Simulate volatility clustering using GARCH-like process
    const volatilityMean = 0.15;
    const persistence = 0.85;
    const volatilityOfVolatility = 0.05;
    
    // Update volatility regime
    const volatilityShock = (random() - 0.5) * volatilityOfVolatility;
    volatilityRegime = persistence * volatilityRegime + 
                      (1 - persistence) * volatilityMean + 
                      volatilityShock;
    
    volatilityRegime = Math.max(0.05, Math.min(0.50, volatilityRegime)); // Bound volatility
    
    // Generate returns with fat tails and skewness
    let marketReturn: number;
    
    if (random() < 0.05) {
      // 5% chance of extreme event (fat tails)
      marketReturn = (random() - 0.5) * volatilityRegime * 6;
    } else {
      // Normal market moves with slight negative skew
      const u1 = random();
      const u2 = random();
      
      // Box-Muller transformation for normal distribution
      const standardNormal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Add negative skew (markets fall faster than they rise)
      const skewness = -0.3;
      const skewedReturn = standardNormal + skewness * (standardNormal * standardNormal - 1) / 6;
      
      marketReturn = skewedReturn * volatilityRegime / Math.sqrt(252);
    }
    
    // Add slight negative drift to simulate risk premium
    marketReturn += 0.0001; // Small positive drift
    
    returns.push(marketReturn);
  }
  
  return returns;
};

// Generate sector-specific characteristics
const getSectorCharacteristics = (sector: string) => {
  const sectorData = {
    'Technology': { 
      volatility: 0.28, 
      beta: 1.3, 
      peRange: [25, 45], 
      growth: 0.15,
      cyclicality: 0.2 
    },
    'Healthcare': { 
      volatility: 0.22, 
      beta: 0.9, 
      peRange: [18, 35], 
      growth: 0.08,
      cyclicality: 0.1 
    },
    'Financial': { 
      volatility: 0.35, 
      beta: 1.2, 
      peRange: [10, 18], 
      growth: 0.06,
      cyclicality: 0.8 
    },
    'Consumer': { 
      volatility: 0.20, 
      beta: 0.85, 
      peRange: [15, 25], 
      growth: 0.05,
      cyclicality: 0.6 
    },
    'Industrial': { 
      volatility: 0.25, 
      beta: 1.1, 
      peRange: [12, 22], 
      growth: 0.07,
      cyclicality: 0.7 
    },
    'Energy': { 
      volatility: 0.40, 
      beta: 1.4, 
      peRange: [8, 15], 
      growth: 0.03,
      cyclicality: 0.9 
    }
  };
  
  return sectorData[sector as keyof typeof sectorData] || sectorData['Technology'];
};

// Generate enhanced stock data with realistic patterns
export const generateMockStockData = (symbol: string): StockData => {
  const companies = {
    'AAPL': { name: 'Apple Inc.', sector: 'Technology' },
    'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology' },
    'MSFT': { name: 'Microsoft Corporation', sector: 'Technology' },
    'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumer' },
    'TSLA': { name: 'Tesla Inc.', sector: 'Technology' },
    'META': { name: 'Meta Platforms Inc.', sector: 'Technology' },
    'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology' },
    'NFLX': { name: 'Netflix Inc.', sector: 'Consumer' },
    'AMD': { name: 'Advanced Micro Devices', sector: 'Technology' },
    'INTC': { name: 'Intel Corporation', sector: 'Technology' },
    'JPM': { name: 'JPMorgan Chase & Co.', sector: 'Financial' },
    'JNJ': { name: 'Johnson & Johnson', sector: 'Healthcare' },
    'PFE': { name: 'Pfizer Inc.', sector: 'Healthcare' },
    'XOM': { name: 'Exxon Mobil Corporation', sector: 'Energy' },
    'BAC': { name: 'Bank of America Corp', sector: 'Financial' },
  };
  
  const company = companies[symbol as keyof typeof companies] || 
                 { name: `${symbol} Corporation`, sector: 'Technology' };
  
  const sectorChar = getSectorCharacteristics(company.sector);
  const days = 252; // One trading year
  const basePrice = 50 + Math.random() * 300; // $50-$350 range
  
  // Generate market returns for correlation
  const marketReturns = generateMarketReturns(days, symbol.charCodeAt(0));
  
  // Generate stock-specific parameters
  const stockBeta = sectorChar.beta * (0.8 + Math.random() * 0.4); // Add randomness
  const idiosyncraticVol = sectorChar.volatility * 0.6; // Stock-specific volatility
  const correlation = 0.3 + Math.random() * 0.4; // 30-70% correlation with market
  
  const prices: PriceData[] = [];
  let currentPrice = basePrice;
  
  // Generate earnings announcement dates (quarterly)
  const earningsDates = [63, 126, 189, 252].map(day => day - Math.floor(Math.random() * 10));
  
  for (let i = 0; i < days; i++) {
    const marketReturn = marketReturns[i];
    
    // Generate correlated stock return
    const correlatedReturn = correlation * marketReturn;
    const independentReturn = Math.sqrt(1 - correlation * correlation) * 
                             (Math.random() - 0.5) * idiosyncraticVol / Math.sqrt(252);
    
    let stockReturn = stockBeta * correlatedReturn + independentReturn;
    
    // Add earnings surprise effect
    if (earningsDates.includes(i)) {
      const earningsSurprise = (Math.random() - 0.4) * 0.08; // Slight positive bias
      stockReturn += earningsSurprise;
    }
    
    // Add sector-specific cyclical effects
    const cyclicalEffect = Math.sin((i / 252) * 2 * Math.PI) * sectorChar.cyclicality * 0.002;
    stockReturn += cyclicalEffect;
    
    // Add momentum and mean reversion effects
    if (i > 5) {
      const recentReturns = prices.slice(-5).map(p => p.close);
      const momentum = recentReturns.reduce((sum, price, idx) => {
        if (idx === 0) return sum;
        return sum + (price - recentReturns[idx - 1]) / recentReturns[idx - 1];
      }, 0) / 4;
      
      // Weak momentum effect
      stockReturn += momentum * 0.1;
      
      // Mean reversion from 52-week high/low
      const high52 = Math.max(...prices.map(p => p.close));
      const low52 = Math.min(...prices.map(p => p.close));
      const position = (currentPrice - low52) / (high52 - low52);
      
      if (position > 0.9) stockReturn -= 0.001; // Resistance at highs
      if (position < 0.1) stockReturn += 0.001; // Support at lows
    }
    
    const prevPrice = currentPrice;
    currentPrice = prevPrice * (1 + stockReturn);
    
    // Generate realistic OHLC with proper relationships
    const dailyRange = currentPrice * (0.01 + Math.random() * 0.04); // 1-5% daily range
    const openGap = stockReturn * 0.3; // Partial overnight gap
    
    const open = Math.max(0.01, prevPrice * (1 + openGap));
    const high = Math.max(open, currentPrice) + dailyRange * Math.random() * 0.3;
    const low = Math.min(open, currentPrice) - dailyRange * Math.random() * 0.3;
    const close = Math.max(0.01, currentPrice);
    
    // Generate volume with realistic patterns
    const baseVolume = 1000000 + Math.random() * 3000000;
    let volume = baseVolume;
    
    // Higher volume on large moves
    const priceChange = Math.abs(stockReturn);
    volume *= (1 + priceChange * 10);
    
    // Higher volume on earnings dates
    if (earningsDates.includes(i)) {
      volume *= (1.5 + Math.random() * 2);
    }
    
    // Lower volume on Fridays and Mondays (simulate day-of-week effect)
    const dayOfWeek = i % 5;
    if (dayOfWeek === 0 || dayOfWeek === 4) { // Monday or Friday
      volume *= 0.8;
    }
    
    prices.push({
      time: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open: Math.max(0.01, open),
      high: Math.max(0.01, high),
      low: Math.max(0.01, low),
      close: Math.max(0.01, close),
      volume: Math.floor(volume),
    });
  }
  
  // Calculate derived metrics
  const latestPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2];
  const high52Week = Math.max(...prices.slice(-252).map(p => p.high));
  const low52Week = Math.min(...prices.slice(-252).map(p => p.low));
  const avgVolume = prices.slice(-20).reduce((sum, p) => sum + p.volume, 0) / 20;
  
  // Generate realistic fundamental data
  const marketCap = latestPrice.close * (50000000 + Math.random() * 2000000000); // 50M - 2B shares
  const peRange = sectorChar.peRange;
  
  const fundamentals: FundamentalData = {
    peRatio: peRange[0] + Math.random() * (peRange[1] - peRange[0]),
    pbRatio: 1 + Math.random() * 5,
    roe: 0.05 + Math.random() * 0.25,
    roa: 0.02 + Math.random() * 0.15,
    debtToEquity: Math.random() * 1.5,
    marketCap,
    dividendYield: company.sector === 'Technology' ? Math.random() * 0.02 : Math.random() * 0.05,
    beta: stockBeta,
    eps: latestPrice.close / (peRange[0] + Math.random() * (peRange[1] - peRange[0])),
  };
  
  return {
    symbol,
    name: company.name,
    sector: company.sector,
    currentPrice: latestPrice.close,
    change: latestPrice.close - prevPrice.close,
    changePercent: ((latestPrice.close - prevPrice.close) / prevPrice.close) * 100,
    marketCap,
    volume: latestPrice.volume,
    avgVolume,
    high52Week,
    low52Week,
    prices,
    fundamentals,
  };
};

// Generate correlation matrix for multiple stocks
export const generateCorrelationMatrix = (symbols: string[]): number[][] => {
  const n = symbols.length;
  const matrix: number[][] = [];
  
  // Initialize with identity matrix
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(0);
    matrix[i][i] = 1;
  }
  
  // Fill upper triangle with realistic correlations
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Technology stocks tend to be more correlated
      const correlation = 0.2 + Math.random() * 0.6; // 20-80% correlation
      matrix[i][j] = correlation;
      matrix[j][i] = correlation; // Symmetric matrix
    }
  }
  
  return matrix;
};

// Helper function to get realistic market data
export const generateMarketOverview = () => {
  const baseValues = {
    sp500: 4200 + Math.random() * 800, // 4200-5000 range
    nasdaq: 13000 + Math.random() * 3000, // 13000-16000 range  
    dow: 33000 + Math.random() * 5000, // 33000-38000 range
    vix: 15 + Math.random() * 20, // 15-35 range
    treasuryRate: 0.02 + Math.random() * 0.03, // 2-5% range
  };
  
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  
  // Determine market status
  let marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours' = 'closed';
  
  if (currentDay >= 1 && currentDay <= 5) { // Monday to Friday
    if (currentHour >= 9 && currentHour < 16) {
      marketStatus = 'open';
    } else if (currentHour >= 4 && currentHour < 9) {
      marketStatus = 'pre-market';
    } else if (currentHour >= 16 && currentHour < 20) {
      marketStatus = 'after-hours';
    }
  }
  
  return {
    ...baseValues,
    marketStatus,
  };
};