import { createContext, useContext, useMemo } from 'react';
import type { Language } from '../types';
import { translations } from './translations';

interface I18nValue {
  language: Language;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue>({ language: 'en', t: (key) => key });

export function I18nProvider({ language, children }: { language: Language; children: React.ReactNode }) {
  const value = useMemo(
    () => ({ language, t: (key: string) => translations[language][key] || translations.en[key] || key }),
    [language]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
