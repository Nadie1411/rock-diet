import { useState } from 'react';
import { X } from 'lucide-react';

import { useT } from '../i18n/useT';

/**
 * The nudge towards the mobile app, with a way out.
 *
 * It sits above everything on every page, so on a phone it was taking the top
 * of the screen on every visit with no way to be rid of it. Dismissing is
 * remembered, because being asked again on the next page is the same as not
 * being able to dismiss it at all.
 */
const STORAGE_KEY = 'rd_app_banner_dismissed';

const AppDownloadBanner = () => {
  const { t } = useT();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // Private browsing can refuse storage; showing the banner is the safe
      // side of that, since it stays dismissible either way.
      return false;
    }
  });

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Gone for this page at least.
    }
  };

  if (dismissed) return null;

  return (
    <div className="relative w-full bg-primary text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pe-8 sm:pe-10">
        <div className="text-center sm:text-start">
          <p className="font-semibold text-sm sm:text-base">{t('getOurApp')}</p>
          <p className="text-xs sm:text-sm opacity-90">{t('appBannerSub')}</p>
        </div>

        <a
          href="https://www.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-bg"
        >
          {t('downloadApp')}
        </a>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label={t('commonClose')}
        className="absolute top-2 end-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AppDownloadBanner;
