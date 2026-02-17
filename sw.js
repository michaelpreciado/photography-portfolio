/**
 * Service Worker for Mario Preciado Photography
 * Network-aware caching with safe defaults and graceful fallbacks.
 */

const CACHE_VERSION = 'v1.1.1';
const CACHE_NAME = `mario-preciado-${CACHE_VERSION}`;
const SW_DEBUG = false;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/portfolio.html',
  '/about.html',
  '/contact.html',
  '/css/style.min.css',
  '/js/script.min.js',
  '/js/sw-register.js',
  '/images/optimized/manifest.json',
  '/images/portfolio/header.jpeg'
];

const logger = {
  info(message, meta) {
    if (!SW_DEBUG) return;
    console.info('[sw]', message, meta || '');
  },
  warn(message, meta) {
    console.warn('[sw]', message, meta || '');
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
    logger.info('Install complete');
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('mario-preciado-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
    logger.info('Activate complete');
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Video playback commonly relies on byte-range requests.
  // Returning cached full responses for ranged requests can break media rendering.
  if (request.headers.has('range')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(routeRequest(request));
});

function isCacheableResponse(response) {
  return Boolean(response) && (response.ok || response.type === 'opaque');
}

async function routeRequest(request) {
  if (request.mode === 'navigate') {
    return networkFirst(request, '/index.html');
  }

  switch (request.destination) {
    case 'style':
    case 'script':
    case 'font':
      return staleWhileRevalidate(request);
    case 'image':
    case 'video':
    case 'audio':
      return cacheFirst(request);
    default:
      return networkFirst(request);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    logger.warn('cacheFirst fetch failed', { url: request.url, error: String(error) });
    throw error;
  }
}

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (fallbackPath) {
      const fallback = await cache.match(fallbackPath);
      if (fallback) {
        return fallback;
      }
    }

    logger.warn('networkFirst fallback failed', { url: request.url, error: String(error) });
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      logger.warn('staleWhileRevalidate fetch failed', { url: request.url, error: String(error) });
      return null;
    });

  if (cached) {
    return cached;
  }

  const fresh = await fetchPromise;
  if (fresh) {
    return fresh;
  }

  throw new Error(`Failed to fetch resource: ${request.url}`);
}

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const safeUrls = event.data.urls.filter((value) => typeof value === 'string' && value.startsWith('/'));
      await cache.addAll(safeUrls);
    })());
  }
});
