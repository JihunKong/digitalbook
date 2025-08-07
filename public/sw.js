// Enhanced Service Worker for Digital Textbook PWA
const CACHE_NAME = 'digital-textbook-v2.0';
const RUNTIME_CACHE = 'digital-textbook-runtime-v2.0';
const OFFLINE_PAGE = '/offline.html';

// Core files to cache for offline functionality
const CORE_CACHE_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/',
  '/_next/static/chunks/',
];

// Routes to cache with different strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: [
    /\/_next\/static\//,
    /\/icons\//,
    /\/images\//,
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  ],
  
  // Network first for API calls
  NETWORK_FIRST: [
    /\/api\//,
    /\/auth\//,
  ],
  
  // Stale while revalidate for pages
  STALE_WHILE_REVALIDATE: [
    /^https:\/\/digitalbook\.kr\/$/,
    /\/student\//,
    /\/teacher\//,
    /\/guest\//,
    /\/explore/,
  ],
};

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core files');
      return cache.addAll(CORE_CACHE_FILES);
    }).then(() => {
      console.log('[SW] Core files cached successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Failed to cache core files:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine caching strategy
  let strategy = 'NETWORK_FIRST'; // default

  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(request.url))) {
      strategy = strategyName;
      break;
    }
  }

  event.respondWith(handleRequest(request, strategy));
});

// Handle different caching strategies
async function handleRequest(request, strategy) {
  const cache = await caches.open(RUNTIME_CACHE);

  switch (strategy) {
    case 'CACHE_FIRST':
      return cacheFirst(request, cache);
    
    case 'NETWORK_FIRST':
      return networkFirst(request, cache);
    
    case 'STALE_WHILE_REVALIDATE':
      return staleWhileRevalidate(request, cache);
    
    default:
      return networkFirst(request, cache);
  }
}

// Cache first strategy
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for cache-first:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }

    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);

  // Start network request in background
  const networkRequest = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Background network update failed:', error);
  });

  // Return cached version immediately, or wait for network
  return cachedResponse || networkRequest;
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-assignments':
      event.waitUntil(syncAssignments());
      break;
    case 'sync-progress':
      event.waitUntil(syncProgress());
      break;
    case 'sync-chat-messages':
      event.waitUntil(syncChatMessages());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new updates in your digital textbook!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: '/',
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('디지털 교과서', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Sync functions for offline data
async function syncAssignments() {
  try {
    const offlineAssignments = await getOfflineData('assignments');
    if (offlineAssignments.length > 0) {
      console.log('[SW] Syncing', offlineAssignments.length, 'offline assignments');
      
      for (const assignment of offlineAssignments) {
        await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignment)
        });
      }
      
      await clearOfflineData('assignments');
      console.log('[SW] Assignments synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync assignments:', error);
  }
}

async function syncProgress() {
  try {
    const offlineProgress = await getOfflineData('progress');
    if (offlineProgress.length > 0) {
      console.log('[SW] Syncing', offlineProgress.length, 'progress updates');
      
      for (const progress of offlineProgress) {
        await fetch('/api/student/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress)
        });
      }
      
      await clearOfflineData('progress');
      console.log('[SW] Progress synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync progress:', error);
  }
}

async function syncChatMessages() {
  try {
    const offlineMessages = await getOfflineData('chat-messages');
    if (offlineMessages.length > 0) {
      console.log('[SW] Syncing', offlineMessages.length, 'chat messages');
      
      for (const message of offlineMessages) {
        await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      }
      
      await clearOfflineData('chat-messages');
      console.log('[SW] Chat messages synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync chat messages:', error);
  }
}

// IndexedDB helpers for offline data storage
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DigitalTextbookOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function clearOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DigitalTextbookOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
  });
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  console.log('[SW] Performing periodic content sync');
  // Sync any pending offline data
  await Promise.all([
    syncAssignments(),
    syncProgress(),
    syncChatMessages()
  ]);
}