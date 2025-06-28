import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Settings, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor,
  TestTube,
  Plus,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { notificationService } from '../services/notificationService';
import AlertCreator from './alerts/AlertCreator';
import AlertsList from './alerts/AlertsList';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { cn } from '../utils/cn';

interface SmartAlertsProps {
  symbols?: string[];
  className?: string;
  compact?: boolean;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'],
  className,
  compact = false
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'settings'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);

  const {
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
  } = useAlerts(symbols);

  const { realTimePrices, isConnected } = useRealTimeData(symbols);
  const primarySymbol = symbols[0];
  const realTimePrice = realTimePrices[primarySymbol];


  // 🚀 Alert statistics
  const alertStats = useMemo(() => {
    const activePrice = alerts.priceAlerts.filter(a => a.isActive && !a.isTriggered).length;
    const activeTechnical = alerts.technicalAlerts.filter(a => a.isActive && !a.isTriggered).length;
    const activeNews = alerts.newsAlerts.filter(a => a.isActive).length;
    const triggered = [...alerts.priceAlerts, ...alerts.technicalAlerts].filter(a => a.isTriggered).length;
    const unreadNotifications = alerts.notifications.filter(n => !n.isRead).length;

    return {
      total: activePrice + activeTechnical + activeNews,
      activePrice,
      activeTechnical,
      activeNews,
      triggered,
      unreadNotifications
    };
  }, [alerts]);

  // 🚀 Handle settings updates
  const handleSettingsUpdate = (key: string, value: any) => {
    updateSettings({ [key]: value });
    
    if (key === 'browserNotifications' && value) {
      notificationService.requestNotificationPermission();
    }
  };

  // 🚀 Compact view for dashboard integration
  if (compact) {
    return (
      <div className={cn('p-4 bg-card border rounded-lg', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Smart Alerts</h3>
            {alertStats.unreadNotifications > 0 && (
              <Badge variant="destructive" size="sm">
                {alertStats.unreadNotifications}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="success" size="sm">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm">
                Offline
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{alertStats.total}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{alertStats.triggered}</div>
            <div className="text-xs text-muted-foreground">Triggered</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{alertStats.unreadNotifications}</div>
            <div className="text-xs text-muted-foreground">Notifications</div>
          </div>
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{symbols.length}</div>
            <div className="text-xs text-muted-foreground">Watching</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => setActiveView('create')}>
            <Plus className="w-4 h-4 mr-1" />
            New Alert
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Settings */}
        {showSettings && (
          <div className="mt-4 p-3 bg-muted/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Browser Notifications</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSettingsUpdate('browserNotifications', !alerts.settings.browserNotifications)}
              >
                {alerts.settings.browserNotifications ? (
                  <Monitor className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4 opacity-50" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Sound Alerts</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSettingsUpdate('soundEnabled', !alerts.settings.soundEnabled)}
              >
                {alerts.settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <Button size="sm" variant="outline" onClick={testAlert} className="w-full">
              <TestTube className="w-4 h-4 mr-1" />
              Test Notifications
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 🚀 Full dashboard view
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Smart Alerts</h2>
            <p className="text-muted-foreground">
              Intelligent monitoring and notifications for {symbols.join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'success' : 'secondary'}>
            <Activity className="w-3 h-3 mr-1" />
            {isConnected ? 'Live Data' : 'Offline'}
          </Badge>
          
          {alertStats.unreadNotifications > 0 && (
            <Badge variant="destructive">
              {alertStats.unreadNotifications} New
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setActiveView('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant={activeView === 'create' ? 'default' : 'outline'}
          onClick={() => setActiveView('create')}
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Alert
        </Button>
        <Button
          variant={activeView === 'settings' ? 'default' : 'outline'}
          onClick={() => setActiveView('settings')}
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </div>

      {/* Alert Statistics */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{alertStats.total}</div>
            <div className="text-sm text-muted-foreground">Active Alerts</div>
          </div>
          
          <div className="p-4 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{alertStats.triggered}</div>
            <div className="text-sm text-muted-foreground">Triggered Today</div>
          </div>
          
          <div className="p-4 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">{alertStats.unreadNotifications}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </div>
          
          <div className="p-4 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{symbols.length}</div>
            <div className="text-sm text-muted-foreground">Symbols</div>
          </div>
          
          <div className="p-4 bg-card border rounded-lg text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {realTimePrices[symbols[0]] ? `$${realTimePrices[symbols[0]].price.toFixed(2)}` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">{symbols[0]} Price</div>
          </div>
        </div>
      )}

      {/* Current Price Ticker */}
      {activeView === 'dashboard' && realTimePrices && (
        <div className="space-y-4">
          {Object.values(realTimePrices).map((priceData) => (
            <div
              key={priceData.symbol}
              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold">
                      {priceData.symbol} Live Price
                    </div>
                    <div className="text-2xl font-bold">
                      ${priceData.price.toFixed(2)}
                      <span
                        className={cn(
                          'ml-2 text-sm',
                          priceData.change >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {priceData.change >= 0 ? '+' : ''}
                        {priceData.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div>Volume: {(priceData.volume / 1_000_000).toFixed(1)}M</div>
                  <div>High: ${priceData.high.toFixed(2)}</div>
                  <div>Low: ${priceData.low.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {activeView === 'dashboard' && (
        <AlertsList
          priceAlerts={alerts.priceAlerts}
          technicalAlerts={alerts.technicalAlerts}
          newsAlerts={alerts.newsAlerts}
          notifications={alerts.notifications}
          onToggleAlert={toggleAlert}
          onDeleteAlert={deleteAlert}
          onMarkNotificationRead={markNotificationAsRead}
          onClearNotifications={clearAllNotifications}
          onClearTriggeredAlerts={clearTriggeredAlerts}
        />
      )}

      {activeView === 'create' && (
        <AlertCreator
          symbols={symbols}
          currentPrice={realTimePrice?.price ?? 0}
          onCreatePriceAlert={addPriceAlert}
          onCreateTechnicalAlert={addTechnicalAlert}
          onCreateNewsAlert={addNewsAlert}
        />
      )}

      {activeView === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Notification Settings</h3>
            
            <div className="space-y-4">
              {/* Browser Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Browser Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Show desktop notifications when alerts trigger
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={alerts.settings.browserNotifications ? 'default' : 'outline'}
                  onClick={() => handleSettingsUpdate('browserNotifications', !alerts.settings.browserNotifications)}
                >
                  {alerts.settings.browserNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Sound Alerts */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {alerts.settings.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium">Sound Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Play sound when alerts trigger
                    </div>
                  </div>
                </div>
                
                <Button
                  variant={alerts.settings.soundEnabled ? 'default' : 'outline'}
                  onClick={() => handleSettingsUpdate('soundEnabled', !alerts.settings.soundEnabled)}
                >
                  {alerts.settings.soundEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {/* Max Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Max Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Maximum number of notifications to keep
                    </div>
                  </div>
                </div>
                
                <select
                  value={alerts.settings.maxNotifications}
                  onChange={(e) => handleSettingsUpdate('maxNotifications', parseInt(e.target.value))}
                  className="p-2 border rounded-md"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>

              {/* Test Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Test Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Send a test notification to verify settings
                    </div>
                  </div>
                </div>
                
                <Button onClick={testAlert} variant="outline">
                  Test Now
                </Button>
              </div>
            </div>
          </div>

          {/* Permission Status */}
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Permission Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Browser Notifications</span>
                <Badge variant={notificationService.hasPermission ? 'success' : 'destructive'}>
                  {notificationService.hasPermission ? 'Granted' : 'Denied'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Web Audio API</span>
                <Badge variant="success">Supported</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Real-time Data</span>
                <Badge variant={isConnected ? 'success' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Offline'}
                </Badge>
              </div>
            </div>

            {!notificationService.hasPermission && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Browser notifications are not enabled. Click the "Enable Browser Notifications" button above to grant permission.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;