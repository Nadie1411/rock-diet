import { useEffect, useMemo, useState } from 'react';

import { useT } from '../i18n/useT';

/**
 * Time left, ticking once a second until the deadline passes.
 *
 * The edit window is a promise the product makes — "you can still change
 * tomorrow's meals" — so the number has to actually count down rather than be
 * a snapshot taken when the page loaded. A customer who leaves the tab open
 * would otherwise be told they have three hours long after the window shut.
 *
 * The timer stops itself at zero rather than running forever behind a static
 * "0m".
 */
export function useCountdown(deadline) {
  const target = useMemo(
    () => (deadline ? new Date(deadline).getTime() : 0),
    [deadline],
  );

  const [remaining, setRemaining] = useState(() =>
    target ? Math.max(0, target - Date.now()) : 0,
  );

  useEffect(() => {
    if (!target) return undefined;

    const tick = () => Math.max(0, target - Date.now());
    setRemaining(tick());
    if (tick() <= 0) return undefined;

    const id = setInterval(() => {
      const next = tick();
      setRemaining(next);
      if (next <= 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  return remaining;
}

/**
 * The app's own formatting: the two largest units that still matter, so
 * "2d 4h" rather than a wall of numbers, and seconds only once they are what
 * is left to watch.
 */
export function useFormatCountdown() {
  const { t } = useT();

  return (ms) => {
    if (!ms || ms <= 0) return `0${t('cutoffMinutes')}`;

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}${t('cutoffDays')} ${hours}${t('cutoffHours')}`;
    if (hours > 0) return `${hours}${t('cutoffHours')} ${minutes}${t('cutoffMinutes')}`;
    if (minutes > 0) return `${minutes}${t('cutoffMinutes')} ${seconds}${t('cutoffSeconds')}`;
    return `${seconds}${t('cutoffSeconds')}`;
  };
}

/** "Changes close in — 2d 4h", or nothing once the window has shut. */
export default function Countdown({ deadline, className = '' }) {
  const { t } = useT();
  const remaining = useCountdown(deadline);
  const format = useFormatCountdown();

  if (!deadline || remaining <= 0) return null;

  // Under an hour is the point at which it stops being background information
  // and starts being something to act on.
  const urgent = remaining < 3600000;

  return (
    <span
      className={`inline-flex items-baseline gap-1.5 ${className}`}
      // Announce it once rather than on every tick.
      aria-live="off"
    >
      <span className="text-text-secondary">{t('cutoffTitle')}</span>
      <strong
        className={`tabular-nums font-extrabold ${urgent ? 'text-error' : 'text-text'}`}
      >
        {format(remaining)}
      </strong>
    </span>
  );
}
