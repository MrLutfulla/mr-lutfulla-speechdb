'use client';

import { useEffect, useState } from 'react';
import { APP_LANG_KEY, AppLang } from '@/lib/i18n';

export function useAppLang() {
  const [lang, setLangState] = useState<AppLang>('uz');

  useEffect(() => {
    const saved = localStorage.getItem(APP_LANG_KEY) as AppLang | null;
    if (saved === 'uz' || saved === 'ru' || saved === 'en') {
      setLangState(saved);
    }

    const sync = () => {
      const next = localStorage.getItem(APP_LANG_KEY) as AppLang | null;
      if (next === 'uz' || next === 'ru' || next === 'en') {
        setLangState(next);
      }
    };

    window.addEventListener('app-lang-changed', sync);
    return () => window.removeEventListener('app-lang-changed', sync);
  }, []);

  const setLang = (next: AppLang) => {
    localStorage.setItem(APP_LANG_KEY, next);
    setLangState(next);
    window.dispatchEvent(new Event('app-lang-changed'));
  };

  return { lang, setLang };
}
