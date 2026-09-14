import { useMemo } from 'react';

import { useLanguage } from '../context/LanguageContext';
import { pick } from '../utils/bilingual';

/**
 * The two things a component needs to speak both languages.
 *
 *   const { t, L } = useT();
 *   t('navPlan')      → interface text, from the app's own translations
 *   L(product.name)   → a bilingual value from the kitchen, in this language
 *
 * Kept together because almost every screen needs both, and importing them
 * separately made it easy to translate the labels and forget the data — which
 * is how an Arabic page ends up listing its dishes in English.
 */
export function useT() {
  const { t, lang, isArabic, dir, setLanguage, toggleLanguage } = useLanguage();

  return useMemo(
    () => ({
      t,
      L: (value) => pick(value, lang),
      lang,
      isArabic,
      dir,
      setLanguage,
      toggleLanguage,
    }),
    [t, lang, isArabic, dir, setLanguage, toggleLanguage],
  );
}
