/**
 * Mario Preciado Photography - Service Worker
 * Optimized for iOS performance with improved caching strategies and resource management
 */

const CACHE_NAME = 'mario-preciado-photography-v2';
const STATIC_CACHE_NAME = 'static-resources-v2';
const IMAGE_CACHE_NAME = 'images-v2';
const FONT_CACHE_NAME = 'fonts-v2';

// Resources to cache immediately on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/portfolio.html',
  '/styles.css',
  '/script.js',
  '/animations.js',
  '/homepage-intro.css'
];

// Additional resources to cache when they're fetched
const ADDITIONAL_ASSETS = [
  '/hippie-symbols.js',
  '/public/fallback-image.jpg'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching critical app assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
  );
});

// Activate event - clean up old caches and take control of clients
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  // Take control of all open tabs
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            // Remove caches that don't match our current versions
            return cacheName.startsWith('mario-preciado-photography-') && 
                  cacheName !== CACHE_NAME &&
                  cacheName !== STATIC_CACHE_NAME &&
                  cacheName !== IMAGE_CACHE_NAME &&
                  cacheName !== FONT_CACHE_NAME;
          }).map(cacheName => {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all open clients
      self.clients.claim()
    ])
  );
});

// Helper function to determine resource type
function getResourceType(url) {
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return 'image';
  } else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
    return 'font';
  } else {
    return 'static';
  }
}

// Helper function to determine the appropriate cache for a request
function getCacheForRequest(request) {
  const url = new URL(request.url);
  const resourceType = getResourceType(url.pathname);
  
  switch (resourceType) {
    case 'image':
      return IMAGE_CACHE_NAME;
    case 'font':
      return FONT_CACHE_NAME;
    default:
      return STATIC_CACHE_NAME;
  }
}

// Network-first strategy with fallback to cache
async function networkFirstWithCacheFallback(request) {
  const cache = await caches.open(getCacheForRequest(request));
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone the response to cache it and return the original
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing in cache for HTML, return fallback
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/index.html');
    }
    
    // For images, return a fallback image
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return caches.match('/public/fallback-image.jpg');
    }
    
    // Otherwise, let the error propagate
    throw error;
  }
}

// Cache-first strategy with network fallback
async function cacheFirstWithNetworkFallback(request) {
  const cache = await caches.open(getCacheForRequest(request));
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, get from network
  try {
    const networkResponse = await fetch(request);
    // Cache the network response for future use
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // For images, return a fallback if available
    if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return caches.match('/public/fallback-image.jpg');
    }
    
    // Otherwise, let the error propagate
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(getCacheForRequest(request));
  
  // Try to get from cache first
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in the background
  const fetchPromise = fetch(request).then(networkResponse => {
    // Update cache with fresh response
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Fetch event - handle different strategies based on request type
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  const url = new URL(event.request.url);
  
  // Choose strategy based on request type
  if (event.request.method !== 'GET') {
    // For non-GET requests, go straight to network
    return;
  }
  
  // HTML pages - network first with cache fallback for better freshness
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(networkFirstWithCacheFallback(event.request));
    return;
  }
  
  // CSS and JavaScript - stale while revalidate for balance of speed and freshness
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Images - cache first with network fallback for speed
  if (getResourceType(url.pathname) === 'image') {
    event.respondWith(cacheFirstWithNetworkFallback(event.request));
    return;
  }
  
  // Fonts - cache first with network fallback for speed
  if (getResourceType(url.pathname) === 'font') {
    event.respondWith(cacheFirstWithNetworkFallback(event.request));
    return;
  }
  
  // Default to stale while revalidate for other resources
  event.respondWith(staleWhileRevalidate(event.request));
});

// Handle background sync for offline form submissions (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
});

// Process stored form submissions when back online
async function syncContactForms() {
  // This is a placeholder for potential offline form handling
  // For a simple mailto: implementation, this would need to be handled differently
  console.log('[ServiceWorker] Attempting to sync stored forms');
  
  // In a real implementation, we would retrieve stored forms from IndexedDB
  // and process them here
}

// Listen for push notifications (if implemented)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const notification = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification('Mario Preciado Photography', {
      body: notification.body,
      icon: '/public/notification-icon.png',
      badge: '/public/notification-badge.png',
      data: notification.data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Open the correct page when notification is clicked
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Check if there is already a window open
      for (let client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
}); 