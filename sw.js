/**
 * Service Worker for Mario Preciado Photography
 * Provides offline support and aggressive caching for optimal performance
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `mario-preciado-${CACHE_VERSION}`;

// Core assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/portfolio.html',
  '/about.html',
  '/contact.html',
  '/css/style.min.css',
  '/js/script.min.js',
  '/images/portfolio/header.jpeg'
];

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: ['css', 'js', 'woff2', 'woff', 'ttf', 'eot'],
  networkFirst: ['html'],
  cacheOnly: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'mp4', 'webm']
};

/**
 * Install event - cache core assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Core assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to cache core assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('mario-preciado-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (CDNs, external resources)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleFetch(request));
});

/**
 * Handle fetch with appropriate caching strategy
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop().toLowerCase();

  // Determine strategy based on file type
  if (CACHE_STRATEGIES.cacheFirst.includes(extension)) {
    return cacheFirst(request);
  } else if (CACHE_STRATEGIES.networkFirst.includes(extension)) {
    return networkFirst(request);
  } else if (CACHE_STRATEGIES.cacheOnly.includes(extension)) {
    return cacheOnly(request);
  }

  // Default to network first for unknown types
  return networkFirst(request);
}

/**
 * Cache-first strategy - check cache, fallback to network
 * Best for: Static assets (CSS, JS, fonts)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    throw error;
  }
}

/**
 * Network-first strategy - try network, fallback to cache
 * Best for: HTML pages that may update
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, using cache:', request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

/**
 * Cache-only strategy - serve from cache, fetch in background
 * Best for: Images and media (large files that rarely change)
 */
async function cacheOnly(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response);
        }
      })
      .catch(() => {
        // Silently fail background updates
      });

    return cached;
  }

  // First time seeing this resource - fetch and cache
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[ServiceWorker] Failed to fetch and cache:', error);
    throw error;
  }
}

/**
 * Background sync for offline submissions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

/**
 * Sync form submissions when back online
 */
async function syncForms() {
  // Placeholder for future form sync functionality
  console.log('[ServiceWorker] Syncing forms...');
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
