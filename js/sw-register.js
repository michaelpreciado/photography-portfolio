/**
 * Service Worker Registration
 * Registers the service worker and handles updates.
 */

(() => {
  const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
  const SW_DEBUG = window.location.search.includes('debug=true');
  let hasControllerReloaded = false;

  const logger = {
    info(message, meta) {
      if (!SW_DEBUG) return;
      console.info('[sw-register]', message, meta || '');
    },
    warn(message, meta) {
      console.warn('[sw-register]', message, meta || '');
    }
  };

  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    logger.warn('Service worker unsupported or insecure context; skipping registration.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.info('Service worker registered', { scope: registration.scope });

      const checkForUpdates = () => {
        registration.update().catch((error) => {
          logger.warn('Service worker update check failed', error);
        });
      };

      checkForUpdates();
      window.setInterval(checkForUpdates, UPDATE_INTERVAL_MS);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state !== 'installed' || !navigator.serviceWorker.controller) {
            return;
          }

          logger.info('New service worker version installed; activating.');
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasControllerReloaded) return;
        hasControllerReloaded = true;
        window.location.reload();
      });
    } catch (error) {
      logger.warn('Service worker registration failed', error);
    }
  });
})();
