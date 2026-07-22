const MEASUREMENT_ID = 'G-6LN7QL6SP2';
const DISABLE_KEY = `ga-disable-${MEASUREMENT_ID}`;
let loading: Promise<void> | null = null;
let initialPageViewHandled = false;

function analyticsWindow() {
  return window as typeof window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [DISABLE_KEY]?: boolean;
  };
}

function ensureGtag(): void {
  const target = analyticsWindow();
  target.dataLayer = target.dataLayer || [];
  target.gtag =
    target.gtag ||
    function (...args: unknown[]) {
      target.dataLayer!.push(args);
    };
}

function analyticsReady(): boolean {
  return typeof analyticsWindow().gtag === 'function';
}

async function loadAnalytics(): Promise<void> {
  if (analyticsReady()) return;
  if (loading) return loading;
  loading = new Promise<void>((resolve) => {
    ensureGtag();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src*="googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"]`
    );
    const finish = () => {
      const target = analyticsWindow();
      target.gtag?.('js', new Date());
      target.gtag?.('config', MEASUREMENT_ID);
      resolve();
    };
    if (existing) {
      if (analyticsReady()) resolve();
      else existing.addEventListener('load', finish, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    script.dataset.openvoxGa = MEASUREMENT_ID;
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(script);
  });
  return loading;
}

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  const target = analyticsWindow();
  target[DISABLE_KEY] = !enabled;
  localStorage.setItem('openvox.analytics', String(enabled));
  if (enabled) await loadAnalytics();
}

export function trackPageView(path: string, title: string): void {
  const target = analyticsWindow();
  if (target[DISABLE_KEY] || !analyticsReady()) return;
  if (!initialPageViewHandled) {
    initialPageViewHandled = true;
    return;
  }
  target.gtag?.('event', 'page_view', {
    page_location: window.location.href,
    page_path: path,
    page_title: title
  });
}
