import { describe, expect, it } from 'vitest';
import { getInitialLanguagePreference, getInitialThemePreference, mirrorInterfacePreferences } from '../src/core/systemPreferences';
import { detectSystemLanguage } from '../src/i18n/detectLanguage';

describe('system preferences', () => {
  it('maps supported browser languages to OpenVox languages', () => {
    expect(detectSystemLanguage(['uk-UA'])).toBe('uk');
    expect(detectSystemLanguage(['de-DE'])).toBe('de');
    expect(detectSystemLanguage(['en-US'])).toBe('en');
  });

  it('falls back to English for Russian and unsupported languages', () => {
    expect(detectSystemLanguage(['ru-RU'])).toBe('en');
    expect(detectSystemLanguage(['pl-PL'])).toBe('en');
    expect(detectSystemLanguage(['fr-FR', 'ru-RU'])).toBe('en');
  });

  it('uses only the primary browser language and falls back to English when it is unsupported', () => {
    expect(detectSystemLanguage(['fr-FR', 'de-DE', 'en-US'])).toBe('en');
    expect(detectSystemLanguage(['ru-RU', 'uk-UA'])).toBe('en');
    expect(detectSystemLanguage(['de-DE', 'uk-UA'])).toBe('de');
  });

  it('persists explicit interface preferences for correct first paint', () => {
    localStorage.clear();
    mirrorInterfacePreferences('de', 'dark');
    expect(getInitialLanguagePreference()).toBe('de');
    expect(getInitialThemePreference()).toBe('dark');
  });
});
