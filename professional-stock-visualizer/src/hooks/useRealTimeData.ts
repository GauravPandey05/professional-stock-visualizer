import { useState, useEffect, useRef, useCallback } from 'react';

interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  open: number;
}

interface RealTimeDataHook {
  realTimePrices: Record<string, RealTimePrice>;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastUpdate: Date | null;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  forceReconnect: () => void;
}

export const useRealTimeData = (initialSymbols: string[] = []): RealTimeDataHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());
  const [realTimePrices, setRealTimePrices] = useState<Record<string, RealTimePrice>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());

  // 🔁 Keep subscribedSymbolsRef in sync with state
  useEffect(() => {
    subscribedSymbolsRef.current = subscribedSymbols;
  }, [subscribedSymbols]);

  const simulatePriceUpdate = useCallback(() => {
    const symbols = Array.from(subscribedSymbolsRef.current);

    setRealTimePrices(prev => {
      const updates: Record<string, RealTimePrice> = {};

      for (const symbol of symbols) {
        const existing = prev[symbol];
        const base = existing?.price || 150 + Math.random() * 100;
        const changePercent = (Math.random() - 0.5) * 2;
        const change = base * (changePercent / 100);
        const price = parseFloat((base + change).toFixed(2));

        updates[symbol] = {
          symbol,
          price,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          volume: existing?.volume ?? Math.floor(Math.random() * 9e6 + 1e6),
          timestamp: Date.now(),
          bid: parseFloat((price - 0.01).toFixed(2)),
          ask: parseFloat((price + 0.01).toFixed(2)),
          high: existing ? Math.max(price, existing.high) : price + Math.random() * 5,
          low: existing ? Math.min(price, existing.low) : price - Math.random() * 5,
          open: existing?.open ?? base
        };
      }

      return {
        ...prev,
        ...updates
      };
    });

    setLastUpdate(new Date());
  }, []);

  const startSimulation = useCallback(() => {
    console.log('🔧 Starting price simulation...');
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsConnected(true);
    setConnectionStatus('connected');
    setReconnectAttempts(0);

    simulationIntervalRef.current = setInterval(() => {
      simulatePriceUpdate();
    }, 2000);

    console.log('✅ Price simulation started');
  }, [simulatePriceUpdate]);

  const stopSimulation = useCallback(() => {
    console.log('🛑 Stopping price simulation...');
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    console.log('✅ Price simulation stopped');
  }, []);

  const connectToRealTimeData = useCallback(() => {
    console.log('📡 Attempting to connect to real-time data feed...');
    let isDevelopment = true;
    try {
      isDevelopment = import.meta.env?.DEV ||
                      import.meta.env?.MODE === 'development' ||
                      window.location.hostname === 'localhost';
    } catch (error) {
      console.warn('Could not access environment variables, defaulting to development mode');
      isDevelopment = true;
    }

    if (isDevelopment) {
      console.log('🔧 Development mode: Using simulated data');
      startSimulation();
      return;
    }

    console.log('🔧 Production mode: Implement real WebSocket connection');
    startSimulation(); // Replace with real connection logic
  }, [startSimulation]);

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`📡 Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      connectToRealTimeData();
    }, delay);
  }, [reconnectAttempts, connectToRealTimeData]);

  const subscribe = useCallback((symbol: string) => {
    console.log(`📡 Subscribing to ${symbol}`);
    setSubscribedSymbols(prev => new Set([...prev, symbol.toUpperCase()]));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const subscribeMessage = JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbol.toLowerCase()}@ticker`],
        id: Date.now()
      });
      wsRef.current.send(subscribeMessage);
    }
  }, []);

  const unsubscribe = useCallback((symbol: string) => {
    console.log(`📡 Unsubscribing from ${symbol}`);
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol.toUpperCase());
      return newSet;
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [`${symbol.toLowerCase()}@ticker`],
        id: Date.now()
      });
      wsRef.current.send(unsubscribeMessage);
    }
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('📡 Force reconnecting...');
    stopSimulation();

    if (wsRef.current) {
      wsRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setReconnectAttempts(0);
    connectToRealTimeData();
  }, [connectToRealTimeData, stopSimulation]);

  useEffect(() => {
    setSubscribedSymbols(new Set(initialSymbols.map(s => s.toUpperCase())));
    connectToRealTimeData();

    return () => {
      stopSimulation();
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, 'Component unmounting');
    };
  }, []);

  return {
    realTimePrices,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastUpdate,
    subscribe,
    unsubscribe,
    forceReconnect
  };
};
