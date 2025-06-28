import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import Badge from './ui/Badge';
import { cn } from '../utils/cn';

interface LivePriceIndicatorProps {
  symbol: string;
  className?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'detailed' | 'minimal';
}

const LivePriceIndicator: React.FC<LivePriceIndicatorProps> = ({
  symbol,
  className,
  showDetails = true,
  size = 'md',
  variant = 'detailed'
}) => {
  const { realTimePrices, isConnected, connectionStatus, lastUpdate } = useRealTimeData();
  const realTimePrice = realTimePrices[symbol.toUpperCase()];
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  // 🚀 Animate price changes
  useEffect(() => {
    if (realTimePrice?.price && previousPrice !== null) {
      if (realTimePrice.price > previousPrice) {
        setPriceAnimation('up');
      } else if (realTimePrice.price < previousPrice) {
        setPriceAnimation('down');
      }

      // Clear animation after 1 second
      const timeout = setTimeout(() => setPriceAnimation(null), 1000);
      return () => clearTimeout(timeout);
    }
  }, [realTimePrice?.price, previousPrice]);

  // 🚀 Track previous price
  useEffect(() => {
    if (realTimePrice?.price) {
      setPreviousPrice(realTimePrice.price);
    }
  }, [realTimePrice?.price]);

  // 🚀 Size configurations
  const sizeConfigs = {
    sm: {
      container: 'text-sm',
      price: 'text-lg font-bold',
      change: 'text-xs',
      icon: 'w-3 h-3',
      badge: 'text-xs'
    },
    md: {
      container: 'text-base',
      price: 'text-xl font-bold',
      change: 'text-sm',
      icon: 'w-4 h-4',
      badge: 'text-xs'
    },
    lg: {
      container: 'text-lg',
      price: 'text-2xl font-bold',
      change: 'text-base',
      icon: 'w-5 h-5',
      badge: 'text-sm'
    }
  };

  const config = sizeConfigs[size];

  // 🚀 Get status color
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 🚀 Get price change color and icon with null safety
  const getPriceChangeInfo = () => {
    if (!realTimePrice?.change && realTimePrice?.change !== 0) {
      return { color: 'text-gray-600', Icon: Activity };
    }
    
    const change = realTimePrice.change ?? 0;
    const isPositive = change >= 0;
    
    return {
      color: isPositive ? 'text-green-600' : 'text-red-600',
      Icon: isPositive ? TrendingUp : TrendingDown
    };
  };

  const { color: changeColor, Icon: ChangeIcon } = getPriceChangeInfo();

  // 🚀 Safe getters with fallbacks
  const getCurrentPrice = () => realTimePrice?.price?.toFixed(2) ?? '---';
  const getChange = () => realTimePrice?.change?.toFixed(2) ?? '0.00';
  const getChangePercent = () => realTimePrice?.changePercent?.toFixed(2) ?? '0.00';
  const getVolume = () => realTimePrice?.volume ? (realTimePrice.volume / 1000000).toFixed(1) : '0.0';
  const getHigh = () => realTimePrice?.high?.toFixed(2) ?? '0.00';
  const getLow = () => realTimePrice?.low?.toFixed(2) ?? '0.00';
  const getBid = () => realTimePrice?.bid?.toFixed(2) ?? '0.00';
  const getAsk = () => realTimePrice?.ask?.toFixed(2) ?? '0.00';

  // 🚀 Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', config.container, className)}>
        <div className={cn('flex items-center gap-1', config.price, 
          priceAnimation === 'up' ? 'text-green-600' : 
          priceAnimation === 'down' ? 'text-red-600' : ''
        )}>
          ${getCurrentPrice()}
        </div>
        <div className={cn('flex items-center gap-1', changeColor, config.change)}>
          <ChangeIcon className={config.icon} />
          {getChangePercent()}%
        </div>
      </div>
    );
  }

  // 🚀 Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-card border rounded-lg', config.container, className)}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className={cn(config.icon, 'text-green-600')} />
          ) : (
            <WifiOff className={cn(config.icon, 'text-red-600')} />
          )}
          <span className="font-medium">{symbol}</span>
        </div>
        
        <div className={cn('flex items-center gap-2', config.price,
          priceAnimation === 'up' ? 'text-green-600 animate-pulse' : 
          priceAnimation === 'down' ? 'text-red-600 animate-pulse' : ''
        )}>
          ${getCurrentPrice()}
        </div>
        
        <div className={cn('flex items-center gap-1', changeColor, config.change)}>
          <ChangeIcon className={config.icon} />
          {(realTimePrice?.change ?? 0) >= 0 ? '+' : ''}
          {getChange()}
          ({getChangePercent()}%)
        </div>
      </div>
    );
  }

  // 🚀 Detailed variant (default)
  return (
    <div className={cn('p-4 bg-card border rounded-lg space-y-3', config.container, className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{symbol}</span>
          <Badge 
            variant={isConnected ? 'success' : 'destructive'} 
            size="sm"
            className={config.badge}
          >
            {isConnected ? (
              <>
                <Wifi className={cn(config.icon, 'mr-1')} />
                LIVE
              </>
            ) : (
              <>
                <WifiOff className={cn(config.icon, 'mr-1')} />
                OFFLINE
              </>
            )}
          </Badge>
        </div>
        
        <Badge variant="outline" size="sm" className={config.badge}>
          {connectionStatus.toUpperCase()}
        </Badge>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Current Price</p>
          <div className={cn('flex items-center gap-2', config.price,
            priceAnimation === 'up' ? 'text-green-600 animate-pulse' : 
            priceAnimation === 'down' ? 'text-red-600 animate-pulse' : ''
          )}>
            ${getCurrentPrice()}
            {priceAnimation && (
              <div className={cn('text-xs px-1 py-0.5 rounded', 
                priceAnimation === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}>
                {priceAnimation === 'up' ? '↗' : '↘'}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Change</p>
          <div className={cn('flex items-center gap-1', changeColor, config.change)}>
            <ChangeIcon className={config.icon} />
            <div>
              <div>
                {(realTimePrice?.change ?? 0) >= 0 ? '+' : ''}${getChange()}
              </div>
              <div>({getChangePercent()}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      {showDetails && realTimePrice && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Volume:</span>
            <div className="font-medium">{getVolume()}M</div>
          </div>
          <div>
            <span className="text-muted-foreground">High:</span>
            <div className="font-medium">${getHigh()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Low:</span>
            <div className="font-medium">${getLow()}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Bid/Ask:</span>
            <div className="font-medium">${getBid()}/${getAsk()}</div>
          </div>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          Last update: {lastUpdate.toLocaleTimeString()} 
          {isConnected && <span className="ml-2 text-green-600">● Live</span>}
        </div>
      )}
    </div>
  );
};

export default LivePriceIndicator;