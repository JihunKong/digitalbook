import { useEffect, useState } from 'react';

interface ServiceWorkerStatus {
  isInstalled: boolean;
  isWaiting: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isInstalled: false,
    isWaiting: false,
    isOnline: typeof window !== 'undefined' ? navigator?.onLine ?? true : true,
    registration: null,
  });

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      registerServiceWorker();
      setupOnlineOfflineListeners();
      setupBackgroundSync();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('[PWA] Service Worker registered:', registration.scope);
      
      setStatus(prev => ({
        ...prev,
        isInstalled: true,
        registration
      }));

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[PWA] New service worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New version available
                setStatus(prev => ({ ...prev, isWaiting: true }));
                showUpdateNotification();
              } else {
                // First time install
                console.log('[PWA] Content cached for offline use');
                showInstallSuccessNotification();
              }
            }
            
            if (newWorker.state === 'activated') {
              console.log('[PWA] New service worker activated');
              setStatus(prev => ({ ...prev, isWaiting: false }));
            }
          });
        }
      });

      // Check for waiting service worker
      if (registration.waiting) {
        setStatus(prev => ({ ...prev, isWaiting: true }));
      }

      // Setup message listener
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Setup periodic update checks
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  };

  const setupOnlineOfflineListeners = () => {
    const updateOnlineStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: typeof window !== 'undefined' ? navigator.onLine : true }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  const setupBackgroundSync = () => {
    // Register background sync when going offline
    window.addEventListener('offline', () => {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as any).sync?.register('sync-assignments');
          (registration as any).sync?.register('sync-progress');
          (registration as any).sync?.register('sync-chat-messages');
        });
      }
    });
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('[PWA] Background sync completed:', payload);
        showSyncCompleteNotification(payload);
        break;
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated:', payload);
        break;
      default:
        console.log('[PWA] Unknown message from service worker:', event.data);
    }
  };

  const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('새 버전 사용 가능', {
        body: '디지털 교과서의 새 버전이 준비되었습니다. 새로고침하여 업데이트하세요.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'app-update',
        // @ts-ignore - actions is available in NotificationOptions for some browsers
        actions: [
          { action: 'update', title: '지금 업데이트' },
          { action: 'later', title: '나중에' }
        ]
      });
    }
  };

  const showInstallSuccessNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('오프라인 사용 준비 완료', {
        body: '이제 인터넷 연결 없이도 디지털 교과서를 사용할 수 있습니다.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'offline-ready'
      });
    }
  };

  const showSyncCompleteNotification = (payload: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('동기화 완료', {
        body: `오프라인 작업이 성공적으로 동기화되었습니다.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'sync-complete'
      });
    }
  };

  const updateServiceWorker = () => {
    if (status.registration?.waiting) {
      status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Offline storage utilities
  const storeOfflineData = async (storeName: string, data: any) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'STORE_OFFLINE_DATA',
        payload: { storeName, data }
      });
    }
  };

  const getOfflineData = async (storeName: string) => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.payload);
        };
        
        navigator.serviceWorker.controller?.postMessage({
          type: 'GET_OFFLINE_DATA',
          payload: { storeName }
        }, [messageChannel.port2]);
      } else {
        resolve([]);
      }
    });
  };

  return {
    ...status,
    updateServiceWorker,
    requestNotificationPermission,
    storeOfflineData,
    getOfflineData,
  };
}