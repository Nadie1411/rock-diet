import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Home,
  CalendarDays,
} from 'lucide-react';

import { subscriptionService } from '../services/subscriptionService';
import { useSubscription } from '../context/SubscriptionContext';
import { endChangePlan } from '../utils/changePlanIntent';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * After paying for a subscription.
 *
 * A subscription is bought, not switched on: nothing is applied and no food
 * is cooked until the gateway confirms. So this screen waits rather than
 * congratulating anyone — it reports what the server currently believes, and
 * gives the customer a way to ask again.
 *
 * It also keeps the payment page reachable. Someone who closed the tab by
 * accident has otherwise paid for nothing and has no way back to it.
 */
export default function SubscriptionSuccess() {
  const { t, L, lang } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();

  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');


  useEffect(() => {
    try {
      setPaymentUrl(sessionStorage.getItem('pending_payment_url') || '');
    } catch {
      setPaymentUrl('');
    }
  }, []);

  const check = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated) return;
      if (!silent) setChecking(true);
      try {
        // Returning from the gateway proves nothing on its own — the
        // subscription starts when the webhook or the reconcile confirms the
        // payment. So ask the server, and share the answer with the rest of
        // the app rather than letting this screen hold its own opinion.
        endChangePlan();
        await refreshSubscription().catch(() => {});
        const res = await subscriptionService.getStatus();
        const s = res.data || null;
        setStatus(s);
        if (s?.active) {
          // The package is applied by the payment path, so the account this
          // app is holding is out of date the moment it clears.
          await refreshProfile?.().catch(() => {});
          try {
            sessionStorage.removeItem('pending_subscription');
            sessionStorage.removeItem('pending_payment_url');
            sessionStorage.removeItem('pending_order_id');
          } catch {
            // Nothing to clean up if storage is unavailable.
          }
        }
      } catch {
        // Leave the last known state rather than blanking the screen.
      } finally {
        setChecking(false);
        setCheckedOnce(true);
      }
    },
    [isAuthenticated, refreshProfile],
  );

  useEffect(() => {
    check();
  }, [check]);

  // A cleared payment reaches the server through the gateway, not through
  // this page, so it polls for a while rather than waiting to be told.
  useEffect(() => {
    if (status?.active) return undefined;
    const timer = setInterval(() => check({ silent: true }), 5000);
    return () => clearInterval(timer);
  }, [status?.active, check]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <SignInPrompt reason={t('authGateGeneric')} />;

  const active = Boolean(status?.active);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        {active ? (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto text-success mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">{t('subDoneActive')}</h1>
            <p className="text-text-secondary text-sm mb-8">
              {t('subDoneOnPlan', { plan: L(status.package) })}
              {status.subscriptionEnd && (
                <>
                  {' '}
                  {t('subDoneUntil', {
                    date: new Date(status.subscriptionEnd).toLocaleDateString(
                      lang === 'ar' ? 'ar' : 'en',
                    ),
                  })}
                </>
              )}
              . {t('subDoneNextStep')}
            </p>

            <Link
              to="/week-plan"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
            >
              <CalendarDays className="w-4 h-4" />{t('packageBuyGo')}</Link>
            <Link
              to="/plan"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 mt-2 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
            >{t('seeMyPlan')}</Link>
          </>
        ) : (
          <>
            <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-warning/15 flex items-center justify-center">
              <Clock className="w-7 h-7 text-warning" />
            </span>
            <h1 className="text-2xl font-extrabold mb-2">{t('subDoneTitle')}</h1>
            <p className="text-text-secondary text-sm mb-6">{t('subSuccessPaymentOpened')}</p>

            {checkedOnce && !checking && (
              <p className="text-xs text-text-secondary bg-surface border border-border rounded-xl p-3 mb-6">{t('subSuccessNoPayment')}</p>
            )}

            <button
              type="button"
              onClick={() => check()}
              disabled={checking}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {checking ? 'Checking…' : "I've paid — check now"}
            </button>

            {paymentUrl && (
              <a
                href={paymentUrl}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 mt-2 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />{t('subDoneReopen')}</a>
            )}
          </>
        )}

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 mt-4 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          <Home className="w-4 h-4" />{t('checkoutBackHome')}</Link>
      </div>
    </div>
  );
}
