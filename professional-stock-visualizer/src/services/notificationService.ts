class NotificationService {
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.initializeAudio();
    this.requestNotificationPermission();
  }

  // 🚀 Initialize Web Audio API for custom sounds
  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // 🚀 Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // 🚀 Show browser notification
  showNotification(title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    onClick?: () => void;
  } = {}) {
    if (this.notificationPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      data: options.data,
      tag: options.tag,
      requireInteraction: options.requireInteraction || options.priority === 'critical',
      silent: false,
    };

    try {
      const notification = new Notification(title, notificationOptions);
      
      if (options.onClick) {
        notification.onclick = options.onClick;
      }

      // Auto-close notification after delay (except critical)
      if (options.priority !== 'critical') {
        const delay = options.priority === 'high' ? 8000 : 5000;
        setTimeout(() => {
          notification.close();
        }, delay);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  // 🚀 Play alert sound
  playAlertSound(type: 'info' | 'warning' | 'error' | 'success' | 'critical' = 'info') {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      // Create different tones for different alert types
      const frequencies = {
        info: [800, 600],
        success: [600, 800],
        warning: [400, 400, 400],
        error: [300, 300],
        critical: [1000, 500, 1000, 500, 1000]
      };

      const freqs = frequencies[type];
      this.playTone(freqs);
    } catch (error) {
      console.error('Failed to play alert sound:', error);
    }
  }

  // 🚀 Generate and play tone sequence
  private playTone(frequencies: number[], duration = 200, gap = 100) {
    if (!this.audioContext) return;

    let currentTime = this.audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.setValueAtTime(freq, currentTime);
      oscillator.type = 'sine';

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration / 1000);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration / 1000);

      currentTime += (duration + gap) / 1000;
    });
  }

  // 🚀 Show price alert notification
  showPriceAlert(symbol: string, currentPrice: number, targetPrice: number, type: 'above' | 'below') {
    const direction = type === 'above' ? '📈' : '📉';
    const title = `${direction} ${symbol} Price Alert`;
    const body = `${symbol} has ${type === 'above' ? 'risen above' : 'fallen below'} $${targetPrice.toFixed(2)}. Current price: $${currentPrice.toFixed(2)}`;

    this.showNotification(title, {
      body,
      tag: `price-alert-${symbol}`,
      priority: 'high',
      data: { symbol, currentPrice, targetPrice, type }
    });

    this.playAlertSound(type === 'above' ? 'success' : 'warning');
  }

  // 🚀 Show technical indicator alert
  showTechnicalAlert(symbol: string, indicator: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    const title = `📊 ${symbol} Technical Alert`;
    
    this.showNotification(title, {
      body: `${indicator}: ${message}`,
      tag: `technical-alert-${symbol}-${indicator}`,
      priority,
      data: { symbol, indicator, message }
    });

    const soundType = priority === 'high' ? 'warning' : 'info';
    this.playAlertSound(soundType);
  }

  // 🚀 Show volume spike alert
  showVolumeAlert(symbol: string, currentVolume: number, averageVolume: number, multiplier: number) {
    const title = `🔊 ${symbol} Volume Spike`;
    const body = `Volume is ${multiplier.toFixed(1)}x higher than average. Current: ${this.formatVolume(currentVolume)}, Avg: ${this.formatVolume(averageVolume)}`;

    this.showNotification(title, {
      body,
      tag: `volume-alert-${symbol}`,
      priority: multiplier > 5 ? 'high' : 'medium',
      data: { symbol, currentVolume, averageVolume, multiplier }
    });

    this.playAlertSound('info');
  }

  // 🚀 Show news alert
  showNewsAlert(title: string, content: string, symbol?: string, sentiment?: string) {
    const alertTitle = `📰 ${symbol ? `${symbol} ` : ''}News Alert`;
    
    this.showNotification(alertTitle, {
      body: `${title}\n${content}`,
      tag: `news-alert-${symbol || 'general'}`,
      priority: 'medium',
      data: { title, content, symbol, sentiment }
    });

    this.playAlertSound('info');
  }

  // 🚀 Show system alert
  showSystemAlert(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    const icons = { info: 'ℹ️', warning: '⚠️', error: '❌' };
    const title = `${icons[type]} System Alert`;

    this.showNotification(title, {
      body: message,
      tag: 'system-alert',
      priority: type === 'error' ? 'high' : 'medium'
    });

    this.playAlertSound(type);
  }

  // 🚀 Format volume for display
  private formatVolume(volume: number): string {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  }

  // 🚀 Toggle sound
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // 🚀 Get notification permission status
  get hasPermission() {
    return this.notificationPermission === 'granted';
  }

  // 🚀 Test notification (for settings)
  testNotification() {
    this.showNotification('🧪 Test Notification', {
      body: 'If you can see this, notifications are working correctly!',
      tag: 'test-notification',
      priority: 'low'
    });
    
    this.playAlertSound('info');
  }
}

// 🚀 Singleton instance
export const notificationService = new NotificationService();
export default NotificationService;