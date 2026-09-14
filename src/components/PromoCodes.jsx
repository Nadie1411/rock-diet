import { useEffect, useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

import { couponService } from '../services/couponService';
import { offerService } from '../services/offerService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

/**
 * The codes a customer is allowed to use, where they are about to pay.
 *
 * A promo code is worthless if nobody can find it. The basket listed offers
 * and nothing else, and an offer carries a code only sometimes — so a coupon
 * created in the panel appeared nowhere in the app, and offers without codes
 * drew blank rows with a dead button. Both sources are read here, and only
 * entries that actually have a code survive.
 *
 * Clicking copies. Codes get read out, retyped on a phone, or sent to a
 * friend, and a code you can only apply is a code you cannot share.
 */
const describe = (t, entry) => {
  if (entry.percent) return t('promoPercentOff', { n: entry.percent });
  if (entry.amount) return t('promoAmountOff', { amount: entry.amount.toFixed(3) });
  return '';
};

export default function PromoCodes({ onApply, className = '' }) {
  const { t, L } = useT();
  const { isAuthenticated, user } = useAuth();

  const [codes, setCodes] = useState([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let mounted = true;

    // Signed in, the server can say which codes this person has left; a
    // visitor only gets the public list. Either way a code they have already
    // spent should not be sitting on screen inviting them to spend it again.
    //
    // Keyed on `user` as well as the session so that redeeming one — which
    // refreshes the account — takes it off the list without a reload.
    const couponsFor = isAuthenticated
      ? couponService.getAvailableCoupons()
      : couponService.getCoupons({ active: true });

    // Neither source is essential: a failure here should cost the customer a
    // list of codes, never the ability to pay.
    Promise.allSettled([
      couponsFor,
      offerService.getOffers({ active: true }),
    ]).then(([couponRes, offerRes]) => {
      if (!mounted) return;

      const fromCoupons = (couponRes.value?.data || []).map((c) => ({
        key: c._id,
        code: c.code,
        title: '',
        percent: c.discountType === 'percent' ? c.discountValue : 0,
        amount: c.discountType === 'percent' ? 0 : c.discountValue,
        minOrder: c.minOrder,
      }));

      const fromOffers = (offerRes.value?.data || []).map((o) => ({
        key: o._id,
        code: o.promoCode,
        title: L(o.title),
        percent: o.discountPercent || 0,
        amount: 0,
      }));

      const seen = new Set();
      setCodes(
        [...fromCoupons, ...fromOffers].filter((entry) => {
          const code = (entry.code || '').trim();
          if (!code || seen.has(code)) return false;
          seen.add(code);
          return true;
        }),
      );
    });

    return () => {
      mounted = false;
    };
  }, [L, isAuthenticated, user]);

  if (!codes.length) return null;

  const take = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopied(entry.code);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      // Clipboard refused (an insecure origin, or permission denied). The
      // code is on screen to be read, and applying it still works.
    }
    // Off the list as soon as it is used. The server stops offering it on the
    // next read, but the customer is looking at this one.
    if (onApply) {
      onApply(entry.code);
      setCodes((prev) => prev.filter((c) => c.code !== entry.code));
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-surface p-3 ${className}`}>
      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        {t('availablePromos')}
      </p>

      <div className="space-y-1.5">
        {codes.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => take(entry)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-bg border border-dashed border-border hover:border-primary transition-colors text-start"
          >
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-primary tracking-widest">
                {entry.code}
              </span>
              <span className="block text-[10px] text-text-secondary truncate">
                {entry.title || describe(t, entry)}
              </span>
            </span>

            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-text-secondary">
              {copied === entry.code ? (
                <>
                  <Check className="w-3 h-3 text-success" />
                  {t('promoCopied')}
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  {t('promoCopy')}
                </>
              )}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-text-secondary mt-2">
        {onApply ? t('promoTapHint') : t('promoTapCopyOnly')}
      </p>
    </div>
  );
}
