import { openDB, DBSchema, IDBPDatabase } from 'idb';

// IndexedDB Schema for offline data
interface PWADatabase extends DBSchema {
  'offline-actions': {
    key: string;
    value: {
      id: string;
      action: string;
      data: any;
      timestamp: number;
      retryCount: number;
    };
    indexes: { timestamp: number };
  };
  'cached-content': {
    key: string;
    value: {
      id: string;
      content: any;
      timestamp: number;
      expiresAt: number;
    };
    indexes: { expiresAt: number };
  };
  'user-progress': {
    key: string;
    value: {
      id: string;
      progress: any;
      timestamp: number;
      synced: boolean;
    };
  };
  'push-subscriptions': {
    key: string;
    value: {
      id: string;
      subscription: PushSubscription;
      preferences: NotificationPreferences;
      timestamp: number;
    };
  };
}

interface NotificationPreferences {
  learningReminders: boolean;
  progressUpdates: boolean;
  supportMessages: boolean;
  frequency: 'daily' | 'weekly' | 'never';
}

interface OfflineAction {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class PWAService {
  private db: IDBPDatabase<PWADatabase> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  async init(): Promise<void> {
    try {
      // Initialize IndexedDB
      this.db = await openDB<PWADatabase>('techstep-pwa', 1, {
        upgrade(db) {
          // Offline actions store
          if (!db.objectStoreNames.contains('offline-actions')) {
            const actionsStore = db.createObjectStore('offline-actions', { keyPath: 'id' });
            actionsStore.createIndex('timestamp', 'timestamp');
          }

          // Cached content store
          if (!db.objectStoreNames.contains('cached-content')) {
            const contentStore = db.createObjectStore('cached-content', { keyPath: 'id' });
            contentStore.createIndex('expiresAt', 'expiresAt');
          }

          // User progress store
          if (!db.objectStoreNames.contains('user-progress')) {
            db.createObjectStore('user-progress', { keyPath: 'id' });
          }

          // Push subscriptions store
          if (!db.objectStoreNames.contains('push-subscriptions')) {
            db.createObjectStore('push-subscriptions', { keyPath: 'id' });
          }
        },
      });

      // Set up online/offline listeners
      this.setupNetworkListeners();

      // Register service worker
      await this.registerServiceWorker();

      // Clean up expired content
      await this.cleanupExpiredContent();

      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PWA Service:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineActions();
      this.notifyNetworkStatus(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyNetworkStatus(false);
    });
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyAppUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Offline Action Management
  async queueOfflineAction(action: string, data: any): Promise<void> {
    if (!this.db) return;

    const offlineAction: OfflineAction = {
      id: `${action}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    try {
      await this.db.add('offline-actions', offlineAction);
      console.log('Action queued for offline sync:', action);
    } catch (error) {
      console.error('Failed to queue offline action:', error);
    }
  }

  async syncOfflineActions(): Promise<void> {
    if (!this.db || !this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const actions = await this.db.getAll('offline-actions');
      
      for (const action of actions) {
        try {
          await this.processOfflineAction(action);
          await this.db.delete('offline-actions', action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.action, error);
          
          // Increment retry count
          action.retryCount++;
          
          // Remove action if max retries reached
          if (action.retryCount >= 3) {
            await this.db.delete('offline-actions', action.id);
            console.warn('Action removed after max retries:', action.action);
          } else {
            await this.db.put('offline-actions', action);
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync offline actions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    // Process different types of offline actions
    switch (action.action) {
      case 'save-progress':
        await this.syncUserProgress(action.data);
        break;
      case 'submit-feedback':
        await this.syncFeedback(action.data);
        break;
      case 'update-preferences':
        await this.syncPreferences(action.data);
        break;
      default:
        console.warn('Unknown offline action:', action.action);
    }
  }

  // Content Caching
  async cacheContent(id: string, content: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cachedItem = {
      id,
      content,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    try {
      await this.db.put('cached-content', cachedItem);
    } catch (error) {
      console.error('Failed to cache content:', error);
    }
  }

  async getCachedContent(id: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      const item = await this.db.get('cached-content', id);
      
      if (!item) return null;
      
      // Check if content has expired
      if (Date.now() > item.expiresAt) {
        await this.db.delete('cached-content', id);
        return null;
      }
      
      return item.content;
    } catch (error) {
      console.error('Failed to get cached content:', error);
      return null;
    }
  }

  private async cleanupExpiredContent(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('cached-content', 'readwrite');
      const index = tx.store.index('expiresAt');
      const expiredItems = await index.getAll(IDBKeyRange.upperBound(Date.now()));
      
      for (const item of expiredItems) {
        await tx.store.delete(item.id);
      }
      
      await tx.done;
    } catch (error) {
      console.error('Failed to cleanup expired content:', error);
    }
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPushNotifications(preferences: NotificationPreferences): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) return false;

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
          ) as BufferSource,
        });
      }

      // Store subscription and preferences
      if (this.db && subscription) {
        await this.db.put('push-subscriptions', {
          id: 'main',
          subscription,
          preferences,
          timestamp: Date.now(),
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription, preferences);
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, preferences: NotificationPreferences): Promise<void> {
    // This would send the subscription to your backend
    // For now, we'll just log it
    console.log('Push subscription:', subscription);
    console.log('Notification preferences:', preferences);
  }

  // Progress Management
  async saveProgressOffline(progressId: string, progress: any): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('user-progress', {
        id: progressId,
        progress,
        timestamp: Date.now(),
        synced: this.isOnline,
      });

      if (this.isOnline) {
        await this.syncUserProgress(progress);
      } else {
        await this.queueOfflineAction('save-progress', { progressId, progress });
      }
    } catch (error) {
      console.error('Failed to save progress offline:', error);
    }
  }

  private async syncUserProgress(data: any): Promise<void> {
    // This would sync with your backend
    console.log('Syncing user progress:', data);
  }

  private async syncFeedback(data: any): Promise<void> {
    // This would sync feedback with your backend
    console.log('Syncing feedback:', data);
  }

  private async syncPreferences(data: any): Promise<void> {
    // This would sync preferences with your backend
    console.log('Syncing preferences:', data);
  }

  // Utility methods
  private notifyNetworkStatus(isOnline: boolean): void {
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
  }

  private notifyAppUpdate(): void {
    const event = new CustomEvent('appUpdateAvailable');
    window.dispatchEvent(event);
  }

  // Public getters
  get isAppOnline(): boolean {
    return this.isOnline;
  }

  get isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

export const pwaService = new PWAService();
export type { NotificationPreferences, OfflineAction };