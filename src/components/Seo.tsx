import { useEffect } from 'react';
import { trackPageView } from '../core/analytics';

export function Seo({ title, description, path = '/' }: { title: string; description: string; path?: string }) {
  useEffect(() => {
    document.title = `${title} | OpenVox Studio`;
    const setMeta = (selector: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) element.content = value;
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', `${title} | OpenVox Studio`);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', `${title} | OpenVox Studio`);
    setMeta('meta[name="twitter:description"]', description);
    const normalizedPath = path === '/' ? '/' : `${path.replace(/\/$/, '')}/`;
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const url = new URL(normalizedPath.replace(/^\//, ''), baseUrl).href;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;
    setMeta('meta[property="og:url"]', url);
    trackPageView(normalizedPath, `${title} | OpenVox Studio`);
  }, [title, description, path]);
  return null;
}
