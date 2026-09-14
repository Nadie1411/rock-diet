import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { strings } from '../i18n/strings';
import { extra } from '../i18n/extra';

/**
 * English and Arabic, the way the app does it.
 *
 * The choice is remembered in this browser and written onto <html> as `lang`
 * and `dir`, so the page flips to right-to-left wholesale rather than each
 * component having to remember to. Screen readers and the browser's own text
 * handling read those attributes too, which is why they go on the document
 * and not just into React state.
 */

const LanguageContext = createContext(null);

const KEY = 'rd_lang';
const SUPPORTED = ['en', 'ar'];

const initialLanguage = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    // Storage blocked — fall through to the browser's preference.
  }
  if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar')) {
    return 'ar';
  }
  return 'en';
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      // The choice still applies to this visit, it just isn't remembered.
    }
  }, [lang]);

  /**
   * One string, in the current language.
   *
   * Falls back to English and then to the key itself, so a missing
   * translation shows something recognisable instead of blank space.
   */
  const t = useCallback(
    (key, vars) => {
      const template =
        strings[lang]?.[key] ??
        extra[lang]?.[key] ??
        strings.en?.[key] ??
        extra.en?.[key] ??
        key;
      if (!vars) return template;
      return Object.entries(vars).reduce(
        (out, [name, value]) => out.replaceAll(`{${name}}`, String(value)),
        template,
      );
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      isArabic: lang === 'ar',
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLanguage: (next) => SUPPORTED.includes(next) && setLang(next),
      toggleLanguage: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
      t,
    }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
