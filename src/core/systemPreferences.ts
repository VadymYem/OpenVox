import type { Language, ThemeMode } from '../types';
import { detectSystemLanguage } from '../i18n/detectLanguage';

const LANGUAGE_KEY = 'openvox.language';
const THEME_KEY = 'openvox.theme';

function readPreference(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getInitialLanguagePreference(): Language {
  const saved = readPreference(LANGUAGE_KEY);
  return saved === 'en' || saved === 'uk' || saved === 'de' ? saved : detectSystemLanguage();
}

export function getInitialThemePreference(): ThemeMode {
  const saved = readPreference(THEME_KEY);
  return saved === 'system' || saved === 'dark' || saved === 'light' ? saved : 'system';
}

export function mirrorInterfacePreferences(language: Language, theme: ThemeMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // IndexedDB remains the authoritative settings store when synchronous storage is unavailable.
  }
}
