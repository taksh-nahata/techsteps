// Enhanced Service Worker for TechStep PWA
const CACHE_VERSION = 'v3'; // Increment version to force cache invalidation
const STATIC_CACHE = `techstep-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `techstep-dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `techstep-offline-${CACHE_VERSION}`;

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/offline.html'
];

// App shell resources
const APP_SHELL = [
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/pages/LandingPage.tsx',
  '/src/components/pwa/NetworkStatus.tsx'
];

// Learning content patterns to cache
const LEARNING_CONTENT_PATTERNS = [
  /\/api\/tutorials/,
  /\/api\/progress/,
  /\/api\/content/
];

// Install event - cache critical resources and app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Cache app shell
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL.filter(url => !CRITICAL_RESOURCES.includes(url)));
      })
    ])
    .then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated and claimed clients');
        return self.clients.claim();
      })
  );
});

// Enhanced fetch event with multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (except fonts and critical CDN resources)
  if (url.origin !== location.origin && 
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com') &&
      !url.hostname.includes('lottie.host')) {
    return;
  }

  // IMPORTANT: Skip caching for JavaScript modules to prevent MIME type errors
  // Module scripts must always be fetched from network to ensure correct MIME type
  if (request.destination === 'script' || 
      request.destination === 'module' ||
      url.pathname.match(/\.[0-9a-f]{8}\.js$/)) {
    // Let network handle module requests without caching
    return;
  }

  // Different strategies for different types of requests
  if (request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
  } else if (isLearningContent(request.url)) {
    event.respondWith(handleLearningContentRequest(request));
  } else if (isStaticAsset(request.url)) {
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Navigation requests - cache first with network fallback
async function handleNavigationRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update cache in background
      updateCacheInBackground(request);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Navigation request failed:', error);
    // Return offline page or cached homepage
    return caches.match('/offline.html') || caches.match('/');
  }
}

// Learning content - network first with cache fallback
async function handleLearningContentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(OFFLINE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Static assets - cache first
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static asset request failed:', error);
    throw error;
  }
}

// Default requests
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Background cache update
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('Background update failed:', error);
  }
}

// Helper functions for request classification
function isCriticalResource(url) {
  return CRITICAL_RESOURCES.some(resource => url.includes(resource)) ||
         url.includes('fonts.googleapis.com') ||
         url.includes('fonts.gstatic.com') ||
         url.includes('.woff2') ||
         url.includes('.woff');
}

function isLearningContent(url) {
  return LEARNING_CONTENT_PATTERNS.some(pattern => pattern.test(url));
}

function isStaticAsset(url) {
  // IMPORTANT: Do NOT cache JavaScript modules - they must come from network
  // to maintain correct MIME types and prevent version mismatches
  return (url.includes('.css') || 
          url.includes('.png') || 
          url.includes('.jpg') || 
          url.includes('.jpeg') ||
          url.includes('.gif') ||
          url.includes('.svg') ||
          url.includes('.woff') ||
          url.includes('.woff2')) &&
         !url.match(/\.[0-9a-f]{8}\.js$/); // Exclude versioned JS chunks
}

// Background sync for offline actions (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Service Worker: Background sync triggered')
    );
  }
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  // Handle client messages gracefully
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Ensure the message port is properly handled
  if (event.ports && event.ports.length > 0) {
    const port = event.ports[0];
    port.postMessage({ success: true });
  }
});