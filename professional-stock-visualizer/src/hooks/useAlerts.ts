import { useState, useEffect, useCallback, useRef } from 'react';
import type { PriceAlert, TechnicalAlert, NewsAlert, AlertNotification, AlertState } from '../types/alerts';
import { checkPriceAlert, checkTechnicalAlert, createAlertNotification } from '../utils/alertTriggers';
import { useRealTimeData } from './useRealTimeData';
import { notificationService } from '../services/notificationService';

export interface UseAlertsHook {
  alerts: AlertState;
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>) => void;
  addTechnicalAlert: (alert: Omit<TechnicalAlert, 'id' | 'createdAt' | 'isTriggered'>) => void;
  addNewsAlert: (alert: Omit<NewsAlert, 'id' | 'createdAt'>) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert | TechnicalAlert | NewsAlert>) => void;
  deleteAlert: (id: string, type: 'price' | 'technical' | 'news') => void;
  toggleAlert: (id: string, type: 'price' | 'technical' | 'news') => void;
  clearTriggeredAlerts: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  testAlert: () => void;
  updateSettings: (settings: Partial<AlertState['settings']>) => void;
}

export const useAlerts = (symbols: string[] = []): UseAlertsHook => {
  const [alerts, setAlerts] = useState<AlertState>({
    priceAlerts: [],
    technicalAlerts: [],
    newsAlerts: [],
    notifications: [],
    settings: {
      browserNotifications: true,
      soundEnabled: true,
      emailNotifications: false,
      maxNotifications: 50
    }
  });

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceHistoryRef = useRef<{ [symbol: string]: number[] }>({});

  // Get real-time data for monitoring
  const { realTimePrices } = useRealTimeData(symbols);

  // 🚀 Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('smartAlerts');
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(prevAlerts => ({
          ...prevAlerts,
          ...parsed,
          // Convert date strings back to Date objects
          priceAlerts: parsed.priceAlerts?.map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
            triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
          })) || [],
          technicalAlerts: parsed.technicalAlerts?.map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
            triggeredAt: alert.triggeredAt ? new Date(alert.triggeredAt) : undefined
          })) || [],
          newsAlerts: parsed.newsAlerts?.map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt)
          })) || [],
          notifications: parsed.notifications?.map((notification: any) => ({
            ...notification,
            timestamp: new Date(notification.timestamp)
          })) || []
        }));
      } catch (error) {
        console.error('Failed to load saved alerts:', error);
      }
    }
  }, []);

  // 🚀 Save alerts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('smartAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // 🚀 Monitor price changes and check alerts
  useEffect(() => {
    if (!realTimePrices) return;

    Object.values(realTimePrices).forEach((realTimePrice) => {
    const { symbol, price } = realTimePrice;

    // Update price history
    if (!priceHistoryRef.current[symbol]) {
      priceHistoryRef.current[symbol] = [];
    }
    priceHistoryRef.current[symbol].push(price);

    // Keep only last 100 prices
    if (priceHistoryRef.current[symbol].length > 100) {
      priceHistoryRef.current[symbol] = priceHistoryRef.current[symbol].slice(-100);
    }

    // ✅ Check price alerts
    alerts.priceAlerts.forEach(alert => {
      if (alert.symbol === symbol && alert.isActive && checkPriceAlert(alert, realTimePrice)) {
        const notification = createAlertNotification(
          alert.id,
          `${alert.symbol} Price Alert`,
          alert.message,
          'price',
          alert.priority
        );

        setAlerts(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications.slice(0, prev.settings.maxNotifications - 1)],
          priceAlerts: prev.priceAlerts.map(a =>
            a.id === alert.id ? { ...a, isTriggered: true, triggeredAt: new Date() } : a
          )
        }));
      }
    });

    // ✅ Check technical alerts
    const technicalData = {
      rsi: calculateSimpleRSI(priceHistoryRef.current[symbol]),
      volume: realTimePrice.volume,
      averageVolume: realTimePrice.volume * 0.8 // Simplified
    };

    alerts.technicalAlerts.forEach(alert => {
      if (alert.symbol === symbol && alert.isActive && checkTechnicalAlert(alert, technicalData)) {
        const notification = createAlertNotification(
          alert.id,
          `${alert.symbol} Technical Alert`,
          alert.message,
          'technical',
          alert.priority
        );

        setAlerts(prev => ({
          ...prev,
          notifications: [notification, ...prev.notifications.slice(0, prev.settings.maxNotifications - 1)],
          technicalAlerts: prev.technicalAlerts.map(a =>
            a.id === alert.id ? { ...a, isTriggered: true, triggeredAt: new Date() } : a
          )
        }));
      }
    });
  });
}, [realTimePrices, alerts.priceAlerts, alerts.technicalAlerts]);

  // 🚀 Simple RSI calculation
  const calculateSimpleRSI = (prices: number[]): number => {
    if (prices.length < 15) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.filter(change => change > 0);
    const losses = changes.filter(change => change < 0).map(loss => Math.abs(loss));

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // 🚀 Add price alert
  const addPriceAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isTriggered: false
    };

    setAlerts(prev => ({
      ...prev,
      priceAlerts: [...prev.priceAlerts, newAlert]
    }));

    console.log('📊 Price alert created:', newAlert);
  }, []);

  // 🚀 Add technical alert
  const addTechnicalAlert = useCallback((alertData: Omit<TechnicalAlert, 'id' | 'createdAt' | 'isTriggered'>) => {
    const newAlert: TechnicalAlert = {
      ...alertData,
      id: `technical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isTriggered: false
    };

    setAlerts(prev => ({
      ...prev,
      technicalAlerts: [...prev.technicalAlerts, newAlert]
    }));

    console.log('📊 Technical alert created:', newAlert);
  }, []);

  // 🚀 Add news alert
  const addNewsAlert = useCallback((alertData: Omit<NewsAlert, 'id' | 'createdAt'>) => {
    const newAlert: NewsAlert = {
      ...alertData,
      id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    setAlerts(prev => ({
      ...prev,
      newsAlerts: [...prev.newsAlerts, newAlert]
    }));

    console.log('📊 News alert created:', newAlert);
  }, []);

  // 🚀 Update alert
  const updateAlert = useCallback((id: string, updates: any) => {
  setAlerts(prev => ({
    ...prev,
    priceAlerts: prev.priceAlerts.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ),
    technicalAlerts: prev.technicalAlerts.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    ),
    newsAlerts: prev.newsAlerts.map(alert => 
      alert.id === id ? { ...alert, ...updates } : alert
    )
  }));
}, []);

  // 🚀 Delete alert - FIXED
  const deleteAlert = useCallback((id: string, type: 'price' | 'technical' | 'news') => {
    setAlerts(prev => {
      switch (type) {
        case 'price':
          return {
            ...prev,
            priceAlerts: prev.priceAlerts.filter(alert => alert.id !== id)
          };
        case 'technical':
          return {
            ...prev,
            technicalAlerts: prev.technicalAlerts.filter(alert => alert.id !== id)
          };
        case 'news':
          return {
            ...prev,
            newsAlerts: prev.newsAlerts.filter(alert => alert.id !== id)
          };
        default:
          return prev;
      }
    });
  }, []);

  // 🚀 Toggle alert active state - FIXED
  const toggleAlert = useCallback((id: string, type: 'price' | 'technical' | 'news') => {
    setAlerts(prev => {
      switch (type) {
        case 'price':
          return {
            ...prev,
            priceAlerts: prev.priceAlerts.map(alert => 
              alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
            )
          };
        case 'technical':
          return {
            ...prev,
            technicalAlerts: prev.technicalAlerts.map(alert => 
              alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
            )
          };
        case 'news':
          return {
            ...prev,
            newsAlerts: prev.newsAlerts.map(alert => 
              alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
            )
          };
        default:
          return prev;
      }
    });
  }, []);

  // 🚀 Clear triggered alerts
  const clearTriggeredAlerts = useCallback(() => {
    setAlerts(prev => ({
      ...prev,
      priceAlerts: prev.priceAlerts.filter(alert => !alert.isTriggered),
      technicalAlerts: prev.technicalAlerts.filter(alert => !alert.isTriggered)
    }));
  }, []);

  // 🚀 Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setAlerts(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  }, []);

  // 🚀 Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setAlerts(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // 🚀 Test alert (for settings)
  const testAlert = useCallback(() => {
    notificationService.testNotification();
    
    const testNotification = createAlertNotification(
      'test',
      '🧪 Test Alert',
      'This is a test alert to verify your notification settings.',
      'system',
      'low'
    );

    setAlerts(prev => ({
      ...prev,
      notifications: [testNotification, ...prev.notifications]
    }));
  }, []);

  // 🚀 Update settings
  const updateSettings = useCallback((newSettings: Partial<AlertState['settings']>) => {
    setAlerts(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));

    // Update notification service settings
    if (newSettings.soundEnabled !== undefined) {
      notificationService.setSoundEnabled(newSettings.soundEnabled);
    }
  }, []);

  // 🚀 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    alerts,
    addPriceAlert,
    addTechnicalAlert,
    addNewsAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    clearTriggeredAlerts,
    markNotificationAsRead,
    clearAllNotifications,
    testAlert,
    updateSettings
  };
};