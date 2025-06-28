import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Trash2, 
  Edit3, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Volume2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { PriceAlert, TechnicalAlert, NewsAlert, AlertNotification } from '../../types/alerts';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';

interface AlertsListProps {
  priceAlerts: PriceAlert[];
  technicalAlerts: TechnicalAlert[];
  newsAlerts: NewsAlert[];
  notifications: AlertNotification[];
  onToggleAlert: (id: string, type: 'price' | 'technical' | 'news') => void;
  onDeleteAlert: (id: string, type: 'price' | 'technical' | 'news') => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onClearNotifications: () => void;
  onClearTriggeredAlerts: () => void;
  className?: string;
}

const AlertsList: React.FC<AlertsListProps> = ({
  priceAlerts,
  technicalAlerts,
  newsAlerts,
  notifications,
  onToggleAlert,
  onDeleteAlert,
  onMarkNotificationRead,
  onClearNotifications,
  onClearTriggeredAlerts,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'triggered' | 'notifications'>('active');
  const [showInactive, setShowInactive] = useState(false);

  // 🚀 Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 🚀 Get alert type icon - FIXED
  const getAlertTypeIcon = (alert: PriceAlert | TechnicalAlert | NewsAlert) => {
    // Check if it's a PriceAlert
    if ('condition' in alert) {
      const priceAlert = alert as PriceAlert;
      if (priceAlert.type.includes('price')) return DollarSign;
      if (priceAlert.type.includes('volume')) return Volume2;
      return DollarSign;
    }
    
    // Check if it's a TechnicalAlert
    if ('parameters' in alert) {
      const techAlert = alert as TechnicalAlert;
      if (techAlert.type.includes('rsi') || techAlert.type.includes('macd') || 
          techAlert.type.includes('support') || techAlert.type.includes('resistance')) return TrendingUp;
      if (techAlert.type.includes('volume')) return Volume2;
      return TrendingUp;
    }
    
    // NewsAlert
    return Bell;
  };

  // 🚀 Format alert condition text - FIXED
  const formatAlertCondition = (alert: PriceAlert | TechnicalAlert) => {
    if ('condition' in alert) {
      // Price alert
      const priceAlert = alert as PriceAlert;
      switch (priceAlert.type) {
        case 'price_above':
          return `Price above $${priceAlert.condition.value}`;
        case 'price_below':
          return `Price below $${priceAlert.condition.value}`;
        case 'percent_change':
          return `${priceAlert.condition.value}% change`;
        case 'volume_spike':
          return `${priceAlert.condition.value}x volume spike`;
        default:
          return 'Custom condition';
      }
    } else if ('parameters' in alert) {
      // Technical alert
      const techAlert = alert as TechnicalAlert;
      switch (techAlert.type) {
        case 'rsi_overbought':
          return `RSI > ${techAlert.parameters.rsiLevel || 70}`;
        case 'rsi_oversold':
          return `RSI < ${techAlert.parameters.rsiLevel || 30}`;
        case 'volume_breakout':
          return `Volume > ${techAlert.parameters.volumeMultiplier || 2}x avg`;
        default:
          return techAlert.type.replace('_', ' ').toUpperCase();
      }
    }
    return 'Unknown condition';
  };

  // 🚀 Type guard functions - ADDED
  const isPriceAlert = (alert: PriceAlert | TechnicalAlert | NewsAlert): alert is PriceAlert => {
    return 'condition' in alert;
  };

  const isTechnicalAlert = (alert: PriceAlert | TechnicalAlert | NewsAlert): alert is TechnicalAlert => {
    return 'parameters' in alert;
  };

  const isNewsAlert = (alert: PriceAlert | TechnicalAlert | NewsAlert): alert is NewsAlert => {
    return 'keywords' in alert;
  };

  const hasTriggeredState = (alert: PriceAlert | TechnicalAlert | NewsAlert): alert is PriceAlert | TechnicalAlert => {
    return 'isTriggered' in alert;
  };

  // 🚀 Get all active alerts - FIXED
  const activeAlerts: (PriceAlert | TechnicalAlert | NewsAlert)[] = [
    ...priceAlerts.filter(alert => showInactive ? true : alert.isActive && !alert.isTriggered),
    ...technicalAlerts.filter(alert => showInactive ? true : alert.isActive && !alert.isTriggered),
    ...newsAlerts.filter(alert => showInactive ? true : alert.isActive)
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 🚀 Get triggered alerts - FIXED
  const triggeredAlerts: (PriceAlert | TechnicalAlert)[] = [
    ...priceAlerts.filter(alert => alert.isTriggered),
    ...technicalAlerts.filter(alert => alert.isTriggered)
  ].sort((a, b) => {
    const aTime = a.triggeredAt ? new Date(a.triggeredAt).getTime() : 0;
    const bTime = b.triggeredAt ? new Date(b.triggeredAt).getTime() : 0;
    return bTime - aTime;
  });

  // 🚀 Get unread notifications count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 🚀 Tab configuration
  const tabs = [
    {
      id: 'active' as const,
      label: 'Active Alerts',
      icon: Bell,
      count: activeAlerts.length,
      color: 'text-blue-600'
    },
    {
      id: 'triggered' as const,
      label: 'Triggered',
      icon: CheckCircle,
      count: triggeredAlerts.length,
      color: 'text-green-600'
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: AlertTriangle,
      count: unreadCount,
      color: 'text-orange-600'
    }
  ];

  // 🚀 Render alert item - FIXED with safe property access
  const renderAlertItem = (alert: PriceAlert | TechnicalAlert | NewsAlert, type: 'price' | 'technical' | 'news') => {
    const isTriggered = hasTriggeredState(alert) && alert.isTriggered;
    const Icon = getAlertTypeIcon(alert);

    return (
      <div key={alert.id} className={cn(
        'p-4 border rounded-lg space-y-3',
        alert.isActive ? 'bg-card' : 'bg-muted/20',
        isTriggered && 'border-green-500 bg-green-50'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={cn('w-5 h-5', 
              isTriggered ? 'text-green-600' : 
              alert.isActive ? 'text-primary' : 'text-muted-foreground'
            )} />
            
            <div>
              <h4 className="font-medium">
                {isPriceAlert(alert) || isTechnicalAlert(alert) ? alert.symbol : 
                 isNewsAlert(alert) ? alert.symbols.join(', ') : 'Unknown'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {type === 'news' && isNewsAlert(alert) && `Keywords: ${alert.keywords.join(', ')}`}
                {type !== 'news' && (isPriceAlert(alert) || isTechnicalAlert(alert)) && formatAlertCondition(alert)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={alert.isActive ? 'default' : 'secondary'}
              size="sm"
              className={getPriorityColor(alert.priority)}
            >
              {alert.priority.toUpperCase()}
            </Badge>

            {isTriggered && (
              <Badge variant="success" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Triggered
              </Badge>
            )}
          </div>
        </div>

        {/* Alert Message - COMPLETELY FIXED */}
        <div className="text-sm">
            {isPriceAlert(alert) && alert.message && (
                <p>{alert.message}</p>
            )}
            {isTechnicalAlert(alert) && alert.message && (
                <p>{alert.message}</p>
            )}
            {isNewsAlert(alert) && (
                <p>
                {alert.message ? 
                    alert.message : 
                    `Monitor news for keywords: ${alert.keywords.join(', ')}`
                }
                </p>
            )}
        </div>

        {/* Metadata - FIXED with safe access */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Created: {alert.createdAt.toLocaleDateString()}</span>
            {hasTriggeredState(alert) && alert.triggeredAt && (
              <span>Triggered: {alert.triggeredAt.toLocaleDateString()}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Safe notification settings access */}
            {alert.notificationSettings?.browser && (
              <Bell className="w-3 h-3">
                <title>Browser notifications enabled</title>
              </Bell>
            )}
            {alert.notificationSettings?.sound && (
              <Volume2 className="w-3 h-3">
                <title>Sound enabled</title>
              </Volume2>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleAlert(alert.id, type)}
              className="text-xs"
            >
              {alert.isActive ? (
                <>
                  <BellOff className="w-3 h-3 mr-1" />
                  Disable
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3 mr-1" />
                  Enable
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteAlert(alert.id, type)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>

          {/* Price metadata for triggered price alerts */}
          {isPriceAlert(alert) && alert.metadata && (
            <div className="text-xs text-muted-foreground">
              Current: ${alert.metadata.currentPrice?.toFixed(2)}
              {alert.metadata.percentChange && (
                <span className={cn('ml-2',
                  alert.metadata.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  ({alert.metadata.percentChange >= 0 ? '+' : ''}{alert.metadata.percentChange.toFixed(2)}%)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 🚀 Render notification item
  const renderNotificationItem = (notification: AlertNotification) => {
    const typeIcons = {
      price: DollarSign,
      technical: TrendingUp,
      news: Bell,
      system: AlertTriangle
    };

    const Icon = typeIcons[notification.type] || Bell;

    return (
      <div 
        key={notification.id} 
        className={cn(
          'p-4 border rounded-lg cursor-pointer transition-all',
          notification.isRead ? 'bg-muted/20' : 'bg-card border-blue-200',
          !notification.isRead && 'hover:bg-blue-50'
        )}
        onClick={() => !notification.isRead && onMarkNotificationRead(notification.id)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('w-5 h-5 mt-0.5', 
            notification.isRead ? 'text-muted-foreground' : 'text-primary'
          )} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={cn('font-medium', 
                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {notification.title}
              </h4>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                  size="sm"
                  className={getPriorityColor(notification.priority)}
                >
                  {notification.priority}
                </Badge>
                
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
            </div>

            <p className={cn('text-sm mb-2',
              notification.isRead ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {notification.timestamp.toLocaleString()}
              </span>
              
              <span className="text-xs text-muted-foreground capitalize">
                {notification.type} alert
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Alerts Management</h3>
        
        <div className="flex items-center gap-2">
          {activeTab === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="text-xs"
            >
              {showInactive ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Active Only
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Show All
                </>
              )}
            </Button>
          )}
          
          {activeTab === 'triggered' && triggeredAlerts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClearTriggeredAlerts}
              className="text-xs"
            >
              Clear Triggered
            </Button>
          )}
          
          {activeTab === 'notifications' && notifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onClearNotifications}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <Badge variant="secondary" size="sm">
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Active Alerts */}
        {activeTab === 'active' && (
          <>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm">Create your first alert to get started</p>
              </div>
            ) : (
              activeAlerts.map(alert => {
                const type: 'price' | 'technical' | 'news' = 
                  isPriceAlert(alert) ? 'price' :
                  isTechnicalAlert(alert) ? 'technical' : 'news';
                return renderAlertItem(alert, type);
              })
            )}
          </>
        )}

        {/* Triggered Alerts */}
        {activeTab === 'triggered' && (
          <>
            {triggeredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No triggered alerts</p>
                <p className="text-sm">Alerts will appear here when conditions are met</p>
              </div>
            ) : (
              triggeredAlerts.map(alert => {
                const type: 'price' | 'technical' = isPriceAlert(alert) ? 'price' : 'technical';
                return renderAlertItem(alert, type);
              })
            )}
          </>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
                <p className="text-sm">Alert notifications will appear here</p>
              </div>
            ) : (
              notifications.map(renderNotificationItem)
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsList;