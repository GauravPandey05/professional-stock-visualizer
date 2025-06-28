import type { RiskMetrics, QuantitativeMetrics } from '../types/stock';

export class QuantAnalytics {
  private static readonly TRADING_DAYS_PER_YEAR = 252;
  private static readonly DEFAULT_RISK_FREE_RATE = 0.025; // 2.5%

  // Calculate daily returns from price series
  static calculateReturns(prices: number[]): number[] {
    if (prices.length < 2) return [];
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(dailyReturn);
    }
    return returns;
  }

  // Calculate log returns (more stable for large price changes)
  static calculateLogReturns(prices: number[]): number[] {
    if (prices.length < 2) return [];
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const logReturn = Math.log(prices[i] / prices[i - 1]);
      returns.push(logReturn);
    }
    return returns;
  }

  // Calculate cumulative returns
  static calculateCumulativeReturns(returns: number[]): number[] {
    const cumReturns: number[] = [0];
    let cumulative = 0;
    
    for (let i = 0; i < returns.length; i++) {
      cumulative += returns[i];
      cumReturns.push(cumulative);
    }
    return cumReturns;
  }

  // Value at Risk using historical simulation method
  static calculateVaR(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const var95 = Math.abs(sortedReturns[Math.max(0, index)] || 0);
    
    return var95;
  }

  // Expected Shortfall (Conditional VaR)
  static calculateExpectedShortfall(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoffIndex = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoffIndex + 1);
    
    if (tailReturns.length === 0) return 0;
    
    const expectedShortfall = Math.abs(
      tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length
    );
    
    return expectedShortfall;
  }

  // Sharpe Ratio calculation
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE): number {
    if (returns.length === 0) return 0;
    
    const annualizedRiskFreeRate = riskFreeRate / this.TRADING_DAYS_PER_YEAR;
    const excessReturns = returns.map(r => r - annualizedRiskFreeRate);
    const meanExcessReturn = this.calculateMean(excessReturns);
    const stdDev = this.calculateStandardDeviation(excessReturns);
    
    if (stdDev === 0) return meanExcessReturn > 0 ? Infinity : 0;
    
    // Annualize the Sharpe ratio
    return (meanExcessReturn * Math.sqrt(this.TRADING_DAYS_PER_YEAR)) / 
           (stdDev * Math.sqrt(this.TRADING_DAYS_PER_YEAR));
  }

  // Sortino Ratio (focuses on downside deviation)
  static calculateSortinoRatio(returns: number[], riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE): number {
    if (returns.length === 0) return 0;
    
    const annualizedRiskFreeRate = riskFreeRate / this.TRADING_DAYS_PER_YEAR;
    const excessReturns = returns.map(r => r - annualizedRiskFreeRate);
    const meanExcessReturn = this.calculateMean(excessReturns);
    
    // Calculate downside deviation (only negative excess returns)
    const negativeExcessReturns = excessReturns.filter(r => r < 0);
    if (negativeExcessReturns.length === 0) {
      return meanExcessReturn > 0 ? Infinity : 0;
    }
    
    const downsideVariance = negativeExcessReturns.reduce((sum, r) => sum + r * r, 0) / negativeExcessReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    if (downsideDeviation === 0) return meanExcessReturn > 0 ? Infinity : 0;
    
    return (meanExcessReturn * Math.sqrt(this.TRADING_DAYS_PER_YEAR)) / 
           (downsideDeviation * Math.sqrt(this.TRADING_DAYS_PER_YEAR));
  }

  // Maximum Drawdown calculation
  static calculateMaxDrawdown(prices: number[]): { maxDrawdown: number; drawdownSeries: number[] } {
    if (prices.length === 0) return { maxDrawdown: 0, drawdownSeries: [] };
    
    let maxDrawdown = 0;
    let peak = prices[0];
    const drawdownSeries: number[] = [0];
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const drawdown = (peak - prices[i]) / peak;
      drawdownSeries.push(drawdown);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return { maxDrawdown, drawdownSeries };
  }

  // Beta calculation against market benchmark
  static calculateBeta(stockReturns: number[], marketReturns: number[]): number {
    if (stockReturns.length === 0 || marketReturns.length === 0) return 1;
    
    const n = Math.min(stockReturns.length, marketReturns.length);
    if (n < 2) return 1;
    
    const stockSlice = stockReturns.slice(-n);
    const marketSlice = marketReturns.slice(-n);
    
    const stockMean = this.calculateMean(stockSlice);
    const marketMean = this.calculateMean(marketSlice);
    
    let covariance = 0;
    let marketVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const stockDev = stockSlice[i] - stockMean;
      const marketDev = marketSlice[i] - marketMean;
      covariance += stockDev * marketDev;
      marketVariance += marketDev * marketDev;
    }
    
    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  // Information Ratio calculation
  static calculateInformationRatio(stockReturns: number[], benchmarkReturns: number[]): number {
    if (stockReturns.length === 0 || benchmarkReturns.length === 0) return 0;
    
    const n = Math.min(stockReturns.length, benchmarkReturns.length);
    const activeReturns = stockReturns.slice(-n).map((r, i) => r - benchmarkReturns.slice(-n)[i]);
    const meanActiveReturn = this.calculateMean(activeReturns);
    const trackingError = this.calculateStandardDeviation(activeReturns);
    
    if (trackingError === 0) return meanActiveReturn > 0 ? Infinity : 0;
    
    return (meanActiveReturn * Math.sqrt(this.TRADING_DAYS_PER_YEAR)) / 
           (trackingError * Math.sqrt(this.TRADING_DAYS_PER_YEAR));
  }

  // Calmar Ratio calculation
  static calculateCalmarRatio(returns: number[], maxDrawdown: number): number {
    if (maxDrawdown === 0 || returns.length === 0) return 0;
    
    const annualizedReturn = this.calculateMean(returns) * this.TRADING_DAYS_PER_YEAR;
    return annualizedReturn / maxDrawdown;
  }

  // Rolling volatility calculation
  static calculateRollingVolatility(returns: number[], window: number = 30): number[] {
    const rollingVol: number[] = [];
    
    for (let i = window - 1; i < returns.length; i++) {
      const windowReturns = returns.slice(i - window + 1, i + 1);
      const volatility = this.calculateStandardDeviation(windowReturns) * Math.sqrt(this.TRADING_DAYS_PER_YEAR);
      rollingVol.push(volatility);
    }
    
    return rollingVol;
  }

  // Correlation calculation
  static calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length === 0 || returns2.length === 0) return 0;
    
    const n = Math.min(returns1.length, returns2.length);
    const slice1 = returns1.slice(-n);
    const slice2 = returns2.slice(-n);
    
    const mean1 = this.calculateMean(slice1);
    const mean2 = this.calculateMean(slice2);
    
    let covariance = 0;
    let variance1 = 0;
    let variance2 = 0;
    
    for (let i = 0; i < n; i++) {
      const dev1 = slice1[i] - mean1;
      const dev2 = slice2[i] - mean2;
      covariance += dev1 * dev2;
      variance1 += dev1 * dev1;
      variance2 += dev2 * dev2;
    }
    
    const denominator = Math.sqrt(variance1 * variance2);
    return denominator === 0 ? 0 : covariance / denominator;
  }

  // Helper function for mean calculation
  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Helper function for standard deviation
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return 0;
    
    const mean = this.calculateMean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  // Main function to calculate all risk metrics
  static calculateAllRiskMetrics(
    prices: number[], 
    marketReturns: number[] = [],
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): { returns: number[]; quantMetrics: QuantitativeMetrics } {
    const returns = this.calculateReturns(prices);
    const cumulativeReturns = this.calculateCumulativeReturns(returns);
    const { maxDrawdown, drawdownSeries } = this.calculateMaxDrawdown(prices);
    const rollingVolatility = this.calculateRollingVolatility(returns);
    
    const riskMetrics: RiskMetrics = {
      var95: this.calculateVaR(returns, 0.95),
      var99: this.calculateVaR(returns, 0.99),
      sharpeRatio: this.calculateSharpeRatio(returns, riskFreeRate),
      maxDrawdown,
      beta: marketReturns.length > 0 ? this.calculateBeta(returns, marketReturns) : 1,
      volatility: this.calculateStandardDeviation(returns) * Math.sqrt(this.TRADING_DAYS_PER_YEAR),
      informationRatio: marketReturns.length > 0 ? this.calculateInformationRatio(returns, marketReturns) : 0,
      sortinoRatio: this.calculateSortinoRatio(returns, riskFreeRate),
      calmarRatio: this.calculateCalmarRatio(returns, maxDrawdown)
    };

    const quantMetrics: QuantitativeMetrics = {
      returns,
      cumulativeReturns,
      rollingVolatility,
      drawdownSeries,
      riskMetrics
    };

    return { returns, quantMetrics };
  }

  // Portfolio-level risk calculations
  static calculatePortfolioRisk(
    positions: Array<{ weight: number; returns: number[] }>,
    correlationMatrix?: number[][]
  ): RiskMetrics {
    if (positions.length === 0) {
      return {
        var95: 0, var99: 0, sharpeRatio: 0, maxDrawdown: 0,
        beta: 1, volatility: 0, informationRatio: 0,
        sortinoRatio: 0, calmarRatio: 0
      };
    }

    // Calculate portfolio returns
    const maxLength = Math.max(...positions.map(p => p.returns.length));
    const portfolioReturns: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      let portfolioReturn = 0;
      let totalWeight = 0;

      for (const position of positions) {
        if (i < position.returns.length) {
          portfolioReturn += position.weight * position.returns[i];
          totalWeight += position.weight;
        }
      }

      if (totalWeight > 0) {
        portfolioReturns.push(portfolioReturn / totalWeight);
      }
    }

    // Calculate portfolio risk metrics
    const { quantMetrics } = this.calculateAllRiskMetrics(
      this.cumulativeReturnsToPrice(portfolioReturns)
    );

    return quantMetrics.riskMetrics;
  }

  // Helper to convert returns to price series for drawdown calculation
  private static cumulativeReturnsToPrice(returns: number[], startPrice: number = 100): number[] {
    const prices = [startPrice];
    let currentPrice = startPrice;

    for (const ret of returns) {
      currentPrice *= (1 + ret);
      prices.push(currentPrice);
    }

    return prices;
  }
}