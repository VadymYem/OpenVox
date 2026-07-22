export function registerOpenVoxServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL || '/';
  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => undefined);
    },
    { once: true }
  );
}
