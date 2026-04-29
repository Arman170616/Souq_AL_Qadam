'use client';
import { useLanguageStore } from '@/store/languageStore';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();
  const next = locale === 'en' ? 'ar' : 'en';

  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={`Switch to ${next === 'ar' ? 'Arabic' : 'English'}`}
      className="px-2.5 py-1.5 rounded-lg text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all select-none"
    >
      {locale === 'en' ? 'ع' : 'EN'}
    </button>
  );
}
