import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock, 
  Globe, 
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { cn } from '../utils/cn';

interface RealTimeStatusProps {
  symbol?: string;
  className?: string;
  showDetails?: boolean;
  autoReconnect?: boolean;
}

interface MarketHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  timezone: string;
  nextOpen?: string;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  symbol = 'AAPL',
  className,
  showDetails = true,
  autoReconnect = true
}) => {
  const { 
    isConnected, 
    connectionStatus, 
    reconnectAttempts, 
    lastUpdate,
    forceReconnect 
  } = useRealTimeData();
  
  const [marketHours, setMarketHours] = useState<MarketHours>({
    isOpen: false,
    openTime: '9:30 AM',
    closeTime: '4:00 PM',
    timezone: 'EST'
  });
  
  const [uptime, setUptime] = useState<number>(0);
  const [connectionStart, setConnectionStart] = useState<Date | null>(null);

  // 🚀 Calculate market hours (simplified)
  useEffect(() => {
    const calculateMarketHours = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      // Market hours: 9:30 AM - 4:00 PM EST (simplified)
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
      const isDuringMarketHours = currentTime >= marketOpen && currentTime < marketClose;
      
      setMarketHours({
        isOpen: isWeekday && isDuringMarketHours,
        openTime: '9:30 AM',
        closeTime: '4:00 PM',
        timezone: 'EST',
        nextOpen: !isWeekday || currentTime >= marketClose ? 
          'Next business day at 9:30 AM EST' : undefined
      });
    };

    calculateMarketHours();
    const interval = setInterval(calculateMarketHours, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // 🚀 Track connection uptime
  useEffect(() => {
    if (isConnected && !connectionStart) {
      setConnectionStart(new Date());
    } else if (!isConnected && connectionStart) {
      setConnectionStart(null);
      setUptime(0);
    }
  }, [isConnected, connectionStart]);

  // 🚀 Update uptime
  useEffect(() => {
    if (connectionStart) {
      const interval = setInterval(() => {
        setUptime(Date.now() - connectionStart.getTime());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [connectionStart]);

  // 🚀 Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // 🚀 Get status info
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Connected',
          description: 'Real-time data streaming'
        };
      case 'connecting':
        return {
          icon: Activity,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Connecting',
          description: 'Establishing connection...'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Error',
          description: 'Connection failed'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Disconnected',
          description: 'No real-time data'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // 🚀 Compact view
  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
        <Badge 
          variant={isConnected ? 'success' : 'secondary'}
          size="sm"
        >
          {statusInfo.label}
        </Badge>
        {lastUpdate && (
          <span className="text-xs text-muted-foreground">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-card border rounded-lg space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Real-Time Status
        </h3>
        
        {!isConnected && autoReconnect && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={forceReconnect}
            className="text-xs"
          >
            Reconnect
          </Button>
        )}
      </div>

      {/* Connection Status */}
      <div className={cn('flex items-center gap-3 p-3 rounded-lg', statusInfo.bgColor)}>
        <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
        <div className="flex-1">
          <div className={cn('font-semibold', statusInfo.color)}>
            {statusInfo.label}
          </div>
          <div className="text-sm text-muted-foreground">
            {statusInfo.description}
          </div>
        </div>
        
        {isConnected && (
          <div className="text-right text-sm">
            <div className="font-medium text-green-600">
              {formatUptime(uptime)}
            </div>
            <div className="text-xs text-muted-foreground">uptime</div>
          </div>
        )}
      </div>

      {/* Market Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4" />
            Market Status
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', 
                marketHours.isOpen ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span>{marketHours.isOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {marketHours.openTime} - {marketHours.closeTime} {marketHours.timezone}
            </div>
            {marketHours.nextOpen && (
              <div className="text-xs text-muted-foreground">
                Next: {marketHours.nextOpen}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Data Updates
          </h4>
          <div className="space-y-1 text-sm">
            {lastUpdate ? (
              <>
                <div>Last: {lastUpdate.toLocaleTimeString()}</div>
                <div className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No updates yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="text-center p-2 bg-muted/20 rounded">
          <div className="font-medium">{symbol}</div>
          <div className="text-muted-foreground">Symbol</div>
        </div>
        <div className="text-center p-2 bg-muted/20 rounded">
          <div className="font-medium">
            {reconnectAttempts > 0 ? reconnectAttempts : '-'}
          </div>
          <div className="text-muted-foreground">Reconnects</div>
        </div>
        <div className="text-center p-2 bg-muted/20 rounded">
          <div className="font-medium">
            {isConnected && marketHours.isOpen ? 'Live' : 'Delayed'}
          </div>
          <div className="text-muted-foreground">Data Type</div>
        </div>
      </div>

      {/* Connection Warning */}
      {!isConnected && reconnectAttempts > 3 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            Multiple reconnection attempts. Check your internet connection.
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeStatus;