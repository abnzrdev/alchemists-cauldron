import { setMessage } from '../i18n/index.ts';

function hasOfflineCache(worker: ServiceWorker): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(ready);
    };
    const timeout = setTimeout(() => finish(false), 30000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      finish(
        typeof data === 'object' &&
          data !== null &&
          'type' in data &&
          data.type === 'PWA_STATUS' &&
          'ready' in data &&
          data.ready === true,
      );
    };
    try {
      worker.postMessage({ type: 'PWA_STATUS', repair: navigator.onLine }, [
        channel.port2,
      ]);
    } catch {
      finish(false);
    }
  });
}

export function registerPwa(root: HTMLElement): void {
  if (
    !import.meta.env.PROD ||
    !window.isSecureContext ||
    !('serviceWorker' in navigator)
  )
    return;
  const status = document.createElement('p');
  status.id = 'pwa-status';
  status.className = 'panel-status';
  status.setAttribute('role', 'status');
  root.querySelector('#menu-dialog .panel-footer')?.before(status);
  const base = new URL(import.meta.env.BASE_URL, document.baseURI);
  const workerUrl = new URL('sw.js', base);
  const showError = () => setMessage(status, 'pwa.error');
  async function register(): Promise<void> {
    setMessage(status, 'pwa.installing');
    const registration = await navigator.serviceWorker.register(workerUrl, {
      scope: base.href,
      updateViaCache: 'none',
    });
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      const controller = navigator.serviceWorker.controller;
      const ready =
        controller?.scriptURL === workerUrl.href &&
        (await hasOfflineCache(controller));
      if (current !== revision) return;
      if (registration.waiting) setMessage(status, 'pwa.update');
      else if (ready) setMessage(status, 'pwa.ready');
      else if (registration.installing) setMessage(status, 'pwa.installing');
      else setMessage(status, 'pwa.unavailable');
    };
    const refreshSafely = () => {
      void refresh().catch(showError);
    };
    const watch = (worker: ServiceWorker | null) => {
      worker?.addEventListener('statechange', refreshSafely);
    };
    watch(registration.installing);
    registration.addEventListener('updatefound', () => {
      watch(registration.installing);
      refreshSafely();
    });
    navigator.serviceWorker.addEventListener('controllerchange', refreshSafely);
    // Recheck after returning to the game, including after an OS/browser storage eviction.
    window.addEventListener('pageshow', refreshSafely);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshSafely();
    });
    refreshSafely();
  }
  const start = () => {
    void register().catch(showError);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
