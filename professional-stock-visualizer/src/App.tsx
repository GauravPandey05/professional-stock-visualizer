import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Search, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import type { StockData, QuantitativeMetrics, MarketData } from './types/stock';
import { generateMockStockData, generateMarketReturns, generateMarketOverview } from './utils/mockData';
import { QuantAnalytics } from './utils/quantAnalytics';
import RiskDashboard from './components/RiskDashboard';
import AlertsPage from './pages/Alertspage';
import {useAlerts} from './hooks/useAlerts';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Badge from './components/ui/Badge';
import AlertsContextProvider from './context/AlertsContext';
import { cn } from './utils/cn';

function DashboardMain({
  searchQuery,
  setSearchQuery,
  stockData,
  setStockData,
  quantMetrics,
  setQuantMetrics,
  marketData,
  isLoading,
  setIsLoading,
  error,
  setError,
  popularSymbols,
  loadStock,
  handleSearch,
  handlePopularStockClick,
  handleKeyPress,
}: any) {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Simplified Search Section */}
      <Card className="mb-8 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Stock Analysis Dashboard</h2>
          <p className="text-muted-foreground">
            Professional-grade quantitative analysis with live charts and risk metrics.
          </p>
        </div>
        
        <div className="flex gap-3 max-w-lg mx-auto mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL, GOOGL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
              maxLength={6}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !searchQuery.trim()}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {/* Popular Stocks */}
        <div className="flex flex-wrap gap-2 justify-center">
          {popularSymbols.map((symbol: string) => (
            <Badge
              key={symbol}
              variant={stockData?.symbol === symbol ? "default" : "secondary"}
              className="cursor-pointer transition-all duration-200 px-3 py-1 hover:bg-primary hover:text-primary-foreground"
              onClick={() => handlePopularStockClick(symbol)}
            >
              {symbol}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <div className="font-semibold">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content - Only show when we have data */}
      {stockData && quantMetrics && (
        <div className="space-y-6">
          {/* Stock Overview */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-foreground">{stockData.symbol}</h2>
                  <Badge variant="secondary">{stockData.sector}</Badge>
                  <Badge variant="default" size="sm">Live Data</Badge>
                </div>
                <h3 className="text-lg text-muted-foreground font-medium">{stockData.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">
                  ${stockData.currentPrice.toFixed(2)}
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  stockData.change >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
                  ({stockData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
                <div className="font-semibold">${(stockData.marketCap / 1e9).toFixed(1)}B</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Volume</div>
                <div className="font-semibold">{(stockData.volume / 1e6).toFixed(1)}M</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">52W High</div>
                <div className="font-semibold">${stockData.high52Week.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">52W Low</div>
                <div className="font-semibold">${stockData.low52Week.toFixed(2)}</div>
              </div>
              {stockData.fundamentals && (
                <>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">P/E Ratio</div>
                    <div className="font-semibold">{stockData.fundamentals.peRatio.toFixed(1)}</div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Beta</div>
                    <div className="font-semibold">{stockData.fundamentals.beta.toFixed(2)}</div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Risk Dashboard - Clean Integration */}
          <RiskDashboard 
            riskMetrics={quantMetrics}
            isLoading={false}
            symbol={stockData.symbol}
            stockData={stockData}
          />
        </div>
      )}

      {/* Simple Loading State */}
      {isLoading && (
        <Card className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Loading Stock Data</h3>
          <p className="text-muted-foreground">Fetching data and calculating metrics...</p>
        </Card>
      )}
    </main>
  );
}

function App() {
  const [searchQuery, setSearchQuery] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [quantMetrics, setQuantMetrics] = useState<QuantitativeMetrics | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];
  const alertsHook = useAlerts(popularSymbols);

  // Load market data and default stock on component mount
  useEffect(() => {
    const market = generateMarketOverview();
    setMarketData(market);
    loadStock('AAPL', false);
    // eslint-disable-next-line
  }, []);

  // Calculate quantitative metrics when stock data changes
  useEffect(() => {
    if (stockData && stockData.prices.length > 0) {
      try {
        const marketReturns = generateMarketReturns(stockData.prices.length - 1);
        const prices = stockData.prices.map(p => p.close);
        const { quantMetrics: metrics } = QuantAnalytics.calculateAllRiskMetrics(
          prices, 
          marketReturns, 
          0.025
        );
        setStockData(prev => prev ? { ...prev, quantMetrics: metrics } : null);
        setQuantMetrics(metrics);
      } catch (error) {
        console.error('Error calculating risk metrics:', error);
        setError('Failed to calculate risk metrics');
      }
    }
  }, [stockData?.symbol]);

  const loadStock = async (symbol: string, showLoading: boolean = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    setQuantMetrics(null);
    try {
      if (showLoading) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      const data = generateMockStockData(symbol.toUpperCase());
      setStockData(data);
      setSearchQuery(symbol.toUpperCase());
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
      console.error('Load stock error:', err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    loadStock(searchQuery, true);
  };

  const handlePopularStockClick = (symbol: string) => {
    setStockData(null);
    setQuantMetrics(null);
    setError(null);
    loadStock(symbol, true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AlertsContextProvider value={alertsHook}>
      <Router>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Professional Stock Analytics</h1>
                    <p className="text-xs text-muted-foreground">Quantitative Risk Analysis</p>
                  </div>
                </div>
                {/* Navigation */}
                <nav className="flex gap-6">
                  <Link
                    to="/"
                    className={cn(
                      "text-sm font-medium px-3 py-1 rounded transition-colors",
                      "bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-900",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-100"
                    )}
                    style={{ boxShadow: "none" }}
                  >
                    Dashboard
                  </Link>
                  <Link to="/alerts" className={cn(
                      "text-sm font-medium px-3 py-1 rounded transition-colors",
                      "bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-900",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-100"
                    )}
                    style={{ boxShadow: "none" }}>Alerts</Link>
                </nav>
                {/* Market Status */}
                {marketData && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground">Market Open</span>
                    </div>
                    <div className="text-muted-foreground">
                      VIX: <span className="font-semibold">{marketData.vix.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
          <Routes>
            <Route
              path="/"
              element={
                <DashboardMain
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  stockData={stockData}
                  setStockData={setStockData}
                  quantMetrics={quantMetrics}
                  setQuantMetrics={setQuantMetrics}
                  marketData={marketData}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  error={error}
                  setError={setError}
                  popularSymbols={popularSymbols}
                  loadStock={loadStock}
                  handleSearch={handleSearch}
                  handlePopularStockClick={handlePopularStockClick}
                  handleKeyPress={handleKeyPress}
                />
              }
            />
            <Route path="/alerts" element={<AlertsPage />} />
          </Routes>
        </div>
      </Router>
    </AlertsContextProvider>
  );
}

export default App;