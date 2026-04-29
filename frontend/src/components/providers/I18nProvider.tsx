'use client';
import { useEffect, useCallback } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { TranslationsContext, messages, type TranslationKey } from '@/lib/i18n';

// Single provider that:
//  1. Reads locale from Zustand (the only place that subscribes)
//  2. Sets <html lang> and <html dir> for RTL layout
//  3. Provides the t() function via React Context
//
// Using React Context (not direct Zustand subscriptions in each component)
// guarantees all descendants re-render synchronously when the locale changes,
// bypassing the hydration timing race in Next.js App Router.
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLanguageStore(s => s.locale);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir  = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey): string =>
      (messages[locale] as typeof messages.en)[key] ?? messages.en[key] ?? (key as string),
    [locale],
  );

  return (
    <TranslationsContext.Provider value={t}>
      {children}
    </TranslationsContext.Provider>
  );
}
