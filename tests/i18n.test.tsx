import { describe, expect, it } from 'vitest';
import { translations } from '../src/i18n/translations';

function sortedKeys(language: keyof typeof translations) {
  return Object.keys(translations[language]).sort();
}

describe('internationalization', () => {
  it('keeps English, Ukrainian and German translation keys in sync', () => {
    const english = sortedKeys('en');
    expect(sortedKeys('uk')).toEqual(english);
    expect(sortedKeys('de')).toEqual(english);
  });

  it('contains no blank interface translations', () => {
    for (const [language, dictionary] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), `${language}:${key}`).not.toBe('');
      }
    }
  });
});

import { PRO_TRANSLATION_KEYS, proText } from '../src/i18n/proTranslations';

it('keeps professional feature translations complete in all supported languages', () => {
  for (const language of ['en', 'uk', 'de'] as const) {
    for (const key of PRO_TRANSLATION_KEYS) {
      expect(proText(language, key)).not.toBe(key);
      expect(proText(language, key).trim().length).toBeGreaterThan(0);
    }
  }
});
