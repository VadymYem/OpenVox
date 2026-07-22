import type { Language } from '../types';

export function detectSystemLanguage(languages?: readonly string[]): Language {
  const primary = languages?.[0] || (typeof navigator !== 'undefined' ? navigator.languages?.[0] || navigator.language : 'en');
  const language = String(primary || 'en').trim().toLowerCase().split(/[-_]/)[0];
  if (language === 'uk') return 'uk';
  if (language === 'de') return 'de';
  return 'en';
}
