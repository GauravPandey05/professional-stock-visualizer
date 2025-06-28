import React, { useState } from 'react';
import { Plus, Bell, TrendingUp, Volume2, DollarSign, Percent, Clock } from 'lucide-react';
import type { PriceAlert, TechnicalAlert, NewsAlert } from '../../types/alerts';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

interface AlertCreatorProps {
  onCreatePriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>) => void;
  onCreateTechnicalAlert: (alert: Omit<TechnicalAlert, 'id' | 'createdAt' | 'isTriggered'>) => void;
  onCreateNewsAlert: (alert: Omit<NewsAlert, 'id' | 'createdAt'>) => void;
  symbols: string[];
  currentPrice?: number;
  className?: string;
}

type AlertType = 'price' | 'technical' | 'news';

const AlertCreator: React.FC<AlertCreatorProps> = ({
  onCreatePriceAlert,
  onCreateTechnicalAlert,
  onCreateNewsAlert,
  symbols,
  currentPrice,
  className
}) => {
  const [alertType, setAlertType] = useState<AlertType>('price');
  const [isCreating, setIsCreating] = useState(false);

  // Price Alert State
  const [priceAlertData, setPriceAlertData] = useState({
    symbol: symbols[0] || 'AAPL',
    type: 'price_above' as 'price_above' | 'price_below' | 'percent_change' | 'volume_spike', // FIXED: Explicit type
    value: currentPrice || 100,
    message: '',
    priority: 'medium' as const,
    browserNotifications: true,
    soundEnabled: true
  });

  // Technical Alert State
  const [technicalAlertData, setTechnicalAlertData] = useState({
    symbol: symbols[0] || 'AAPL',
    type: 'rsi_overbought' as const,
    rsiLevel: 70,
    supportLevel: 0,
    resistanceLevel: 0,
    volumeMultiplier: 2,
    message: '',
    priority: 'medium' as const,
    browserNotifications: true,
    soundEnabled: true
  });

  // News Alert State - FIXED: Added message
  const [newsAlertData, setNewsAlertData] = useState({
    keywords: [''],
    symbols: [symbols[0] || 'AAPL'],
    sentiment: 'any' as const,
    message: '', // ADDED: Missing message field
    priority: 'medium' as const,
    browserNotifications: true,
    soundEnabled: true
  });

  // 🚀 Alert type configurations
  const alertTypes = [
    {
      id: 'price' as AlertType,
      label: 'Price Alert',
      icon: DollarSign,
      description: 'Get notified when price hits a specific level',
      color: 'text-blue-600'
    },
    {
      id: 'technical' as AlertType,
      label: 'Technical Alert',
      icon: TrendingUp,
      description: 'Alerts based on technical indicators',
      color: 'text-green-600'
    },
    {
      id: 'news' as AlertType,
      label: 'News Alert',
      icon: Bell,
      description: 'Get notified about relevant news',
      color: 'text-purple-600'
    }
  ];

  // 🚀 Handle price alert creation
  const handleCreatePriceAlert = () => {
    const alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'> = {
      symbol: priceAlertData.symbol,
      type: priceAlertData.type,
      condition: {
        value: priceAlertData.value,
        operator: priceAlertData.type === 'price_above' ? 'greater_than' : 'less_than'
      },
      isActive: true,
      notificationSettings: {
        browser: priceAlertData.browserNotifications,
        sound: priceAlertData.soundEnabled,
        email: false
      },
      message: priceAlertData.message || generateDefaultPriceMessage(),
      priority: priceAlertData.priority
    };

    onCreatePriceAlert(alert);
    resetForm();
  };

  // 🚀 Handle technical alert creation
  const handleCreateTechnicalAlert = () => {
    const parameters: any = {};
    
    if (technicalAlertData.type.includes('rsi')) {
      parameters.rsiLevel = technicalAlertData.rsiLevel;
    }
    if (technicalAlertData.type.includes('support')) {
      parameters.supportLevel = technicalAlertData.supportLevel;
    }
    if (technicalAlertData.type.includes('resistance')) {
      parameters.resistanceLevel = technicalAlertData.resistanceLevel;
    }
    if (technicalAlertData.type.includes('volume')) {
      parameters.volumeMultiplier = technicalAlertData.volumeMultiplier;
    }

    const alert: Omit<TechnicalAlert, 'id' | 'createdAt' | 'isTriggered'> = {
      symbol: technicalAlertData.symbol,
      type: technicalAlertData.type,
      parameters,
      isActive: true,
      notificationSettings: {
        browser: technicalAlertData.browserNotifications,
        sound: technicalAlertData.soundEnabled,
        email: false
      },
      message: technicalAlertData.message || generateDefaultTechnicalMessage(),
      priority: technicalAlertData.priority
    };

    onCreateTechnicalAlert(alert);
    resetForm();
  };

  // 🚀 Handle news alert creation - FIXED: Added message
  const handleCreateNewsAlert = () => {
    const alert: Omit<NewsAlert, 'id' | 'createdAt'> = {
      keywords: newsAlertData.keywords.filter(k => k.trim() !== ''),
      symbols: newsAlertData.symbols,
      sentiment: newsAlertData.sentiment,
      isActive: true,
      notificationSettings: {
        browser: newsAlertData.browserNotifications,
        sound: newsAlertData.soundEnabled
      },
      message: newsAlertData.message || generateDefaultNewsMessage(), // FIXED: Added message
      priority: newsAlertData.priority
    };

    onCreateNewsAlert(alert);
    resetForm();
  };

  // 🚀 Generate default messages
  const generateDefaultPriceMessage = () => {
    const action = priceAlertData.type === 'price_above' ? 'risen above' : 
                  priceAlertData.type === 'price_below' ? 'fallen below' :
                  priceAlertData.type === 'percent_change' ? 'changed by' :
                  'volume spike detected at';
    return `${priceAlertData.symbol} has ${action} ${priceAlertData.value}${priceAlertData.type === 'percent_change' ? '%' : priceAlertData.type === 'volume_spike' ? 'x' : ''}`;
  };

  const generateDefaultTechnicalMessage = () => {
    const typeMap = {
      'rsi_overbought': `RSI indicates ${technicalAlertData.symbol} may be overbought`,
      'rsi_oversold': `RSI indicates ${technicalAlertData.symbol} may be oversold`,
      'macd_crossover': `MACD bullish crossover detected for ${technicalAlertData.symbol}`,
      'support_break': `${technicalAlertData.symbol} broke below support level`,
      'resistance_break': `${technicalAlertData.symbol} broke above resistance level`,
      'volume_breakout': `Volume spike detected for ${technicalAlertData.symbol}`
    };
    return typeMap[technicalAlertData.type] || `Technical signal detected for ${technicalAlertData.symbol}`;
  };

  // 🚀 Generate default news message - ADDED
  const generateDefaultNewsMessage = () => {
    const keywords = newsAlertData.keywords.filter(k => k.trim() !== '').join(', ');
    return `News alert for ${newsAlertData.symbols.join(', ')} with keywords: ${keywords}`;
  };

  // 🚀 Reset form
  const resetForm = () => {
    setIsCreating(false);
    setPriceAlertData({
      symbol: symbols[0] || 'AAPL',
      type: 'price_above',
      value: currentPrice || 100,
      message: '',
      priority: 'medium',
      browserNotifications: true,
      soundEnabled: true
    });
    setTechnicalAlertData({
      symbol: symbols[0] || 'AAPL',
      type: 'rsi_overbought',
      rsiLevel: 70,
      supportLevel: 0,
      resistanceLevel: 0,
      volumeMultiplier: 2,
      message: '',
      priority: 'medium',
      browserNotifications: true,
      soundEnabled: true
    });
    setNewsAlertData({
      keywords: [''],
      symbols: [symbols[0] || 'AAPL'],
      sentiment: 'any',
      message: '',
      priority: 'medium',
      browserNotifications: true,
      soundEnabled: true
    });
  };

  // 🚀 Main create handler
  const handleCreate = () => {
    switch (alertType) {
      case 'price':
        handleCreatePriceAlert();
        break;
      case 'technical':
        handleCreateTechnicalAlert();
        break;
      case 'news':
        handleCreateNewsAlert();
        break;
    }
  };

  if (!isCreating) {
    return (
      <div className={cn('p-4 bg-card border rounded-lg', className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Create Alert</h3>
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Alert
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertTypes.map(type => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className="p-4 border rounded-lg hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => {
                  setAlertType(type.id);
                  setIsCreating(true);
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={cn('w-5 h-5', type.color)} />
                  <h4 className="font-medium">{type.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-card border rounded-lg space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          Create {alertTypes.find(t => t.id === alertType)?.label}
        </h3>
        <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
          Cancel
        </Button>
      </div>

      {/* Price Alert Form */}
      {alertType === 'price' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <select
                value={priceAlertData.symbol}
                onChange={(e) => setPriceAlertData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Alert Type</label>
              <select
                value={priceAlertData.type}
                onChange={(e) => setPriceAlertData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'price_above' | 'price_below' | 'percent_change' | 'volume_spike'
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="price_above">Price Above</option>
                <option value="price_below">Price Below</option>
                <option value="percent_change">Percent Change</option>
                <option value="volume_spike">Volume Spike</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {(() => {
                switch (priceAlertData.type) {
                  case 'percent_change': return 'Percentage (%)';
                  case 'volume_spike': return 'Volume Multiplier';
                  default: return 'Price ($)';
                }
              })()}
            </label>
            <input
              type="number"
              value={priceAlertData.value}
              onChange={(e) => setPriceAlertData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border rounded-md"
              step={(() => {
                switch (priceAlertData.type) {
                  case 'percent_change':
                  case 'volume_spike':
                    return "0.1";
                  default:
                    return "0.01";
                }
              })()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
            <input
              type="text"
              value={priceAlertData.message}
              onChange={(e) => setPriceAlertData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={generateDefaultPriceMessage()}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priceAlertData.priority}
                onChange={(e) => setPriceAlertData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={priceAlertData.browserNotifications}
                onChange={(e) => setPriceAlertData(prev => ({ ...prev, browserNotifications: e.target.checked }))}
              />
              <span className="text-sm">Browser Notifications</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={priceAlertData.soundEnabled}
                onChange={(e) => setPriceAlertData(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              />
              <span className="text-sm">Sound Alerts</span>
            </label>
          </div>
        </div>
      )}

      {/* Technical Alert Form */}
      {alertType === 'technical' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <select
                value={technicalAlertData.symbol}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Indicator</label>
              <select
                value={technicalAlertData.type}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="rsi_overbought">RSI Overbought</option>
                <option value="rsi_oversold">RSI Oversold</option>
                <option value="macd_crossover">MACD Crossover</option>
                <option value="support_break">Support Break</option>
                <option value="resistance_break">Resistance Break</option>
                <option value="volume_breakout">Volume Breakout</option>
              </select>
            </div>
          </div>

          {/* Dynamic parameters based on selected type */}
          {technicalAlertData.type.includes('rsi') && (
            <div>
              <label className="block text-sm font-medium mb-1">RSI Level</label>
              <input
                type="number"
                value={technicalAlertData.rsiLevel}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, rsiLevel: parseInt(e.target.value) || 70 }))}
                className="w-full p-2 border rounded-md"
                min="0"
                max="100"
              />
            </div>
          )}

          {technicalAlertData.type.includes('volume') && (
            <div>
              <label className="block text-sm font-medium mb-1">Volume Multiplier</label>
              <input
                type="number"
                value={technicalAlertData.volumeMultiplier}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, volumeMultiplier: parseFloat(e.target.value) || 2 }))}
                className="w-full p-2 border rounded-md"
                step="0.1"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
            <input
              type="text"
              value={technicalAlertData.message}
              onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={generateDefaultTechnicalMessage()}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={technicalAlertData.priority}
              onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={technicalAlertData.browserNotifications}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, browserNotifications: e.target.checked }))}
              />
              <span className="text-sm">Browser Notifications</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={technicalAlertData.soundEnabled}
                onChange={(e) => setTechnicalAlertData(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              />
              <span className="text-sm">Sound Alerts</span>
            </label>
          </div>
        </div>
      )}

      {/* News Alert Form - FIXED: Added message field */}
      {alertType === 'news' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Keywords</label>
            {newsAlertData.keywords.map((keyword, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    const newKeywords = [...newsAlertData.keywords];
                    newKeywords[index] = e.target.value;
                    setNewsAlertData(prev => ({ ...prev, keywords: newKeywords }));
                  }}
                  placeholder="Enter keyword..."
                  className="flex-1 p-2 border rounded-md"
                />
                {newsAlertData.keywords.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newKeywords = newsAlertData.keywords.filter((_, i) => i !== index);
                      setNewsAlertData(prev => ({ ...prev, keywords: newKeywords }));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewsAlertData(prev => ({ ...prev, keywords: [...prev.keywords, ''] }))}
            >
              Add Keyword
            </Button>
          </div>

          {/* ADDED: Message field for news alerts */}
          <div>
            <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
            <input
              type="text"
              value={newsAlertData.message}
              onChange={(e) => setNewsAlertData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={generateDefaultNewsMessage()}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sentiment</label>
            <select
              value={newsAlertData.sentiment}
              onChange={(e) => setNewsAlertData(prev => ({ ...prev, sentiment: e.target.value as any }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="any">Any</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={newsAlertData.priority}
              onChange={(e) => setNewsAlertData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newsAlertData.browserNotifications}
                onChange={(e) => setNewsAlertData(prev => ({ ...prev, browserNotifications: e.target.checked }))}
              />
              <span className="text-sm">Browser Notifications</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newsAlertData.soundEnabled}
                onChange={(e) => setNewsAlertData(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              />
              <span className="text-sm">Sound Alerts</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => setIsCreating(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreate}>
          Create Alert
        </Button>
      </div>
    </div>
  );
};

export default AlertCreator;