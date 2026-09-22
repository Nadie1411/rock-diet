import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Home,
  CalendarDays,
} from 'lucide-react';

import { orderService } from '../services/orderService';
import { formatPaid, readReturnParams } from '../hooks/usePaymentResult';
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

  const params = useParams();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [payment, setPayment] = useState(null);
  const [checking, setChecking] = useState(true);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  // The purchase this screen is waiting on: the API puts its id in the
  // return URL's path; what checkout stashed, or the payment token the
  // gateway appends, are the fallbacks.
  const { orderId, paymentToken } = readReturnParams({ params, searchParams });

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

        // Ask about the purchase itself first. This is what starts the
        // subscription when no webhook arrives: the server checks the charge
        // with the gateway and, if it was captured for the right amount,
        // applies the package before the status below is read.
        if (orderId || paymentToken) {
          try {
            const res = orderId
              ? await orderService.reconcilePayment(orderId)
              : await orderService.reconcileByToken(paymentToken);
            const order = res?.data || res;
            setPayment(order || null);
            if (
              order?.paymentStatus === 'failed' ||
              order?.paymentStatus === 'cancelled'
            ) {
              navigate(`/payment/failure/${encodeURIComponent(order._id)}`, {
                replace: true,
              });
              return;
            }
          } catch {
            // The status call below also checks the purchase server-side.
          }
        }

        // One read, shared with the rest of the app through the context —
        // this used to refresh the context and then ask again itself, two
        // identical requests per tick.
        const s = await refreshSubscription().catch(() => null);
        if (s) setStatus(s);
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
    [isAuthenticated, refreshProfile, refreshSubscription, orderId, paymentToken, navigate],
  );

  useEffect(() => {
    check();
  }, [check]);

  // A cleared payment reaches the server through the gateway, not through
  // this page, so it polls for a while rather than waiting to be told. Every
  // five seconds at first, when the answer is most likely to arrive; then
  // every fifteen; and not at all after a quarter-hour, when a tab left open
  // was polling the API to no purpose — the button above still asks on
  // demand.
  useEffect(() => {
    if (status?.active) return undefined;
    const startedAt = Date.now();
    let timer;
    const tick = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed > 15 * 60_000) return;
      await check({ silent: true });
      timer = setTimeout(tick, elapsed < 60_000 ? 5000 : 15000);
    };
    timer = setTimeout(tick, 5000);
    return () => clearTimeout(timer);
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
                      lang === 'ar' ? 'ar-u-nu-arab' : 'en-GB',
                    ),
                  })}
                </>
              )}
              . {t('subDoneNextStep')}
            </p>

            {payment?.paymentStatus === 'paid' && (
              <p className="text-xs text-text-secondary bg-surface border border-border rounded-xl px-4 py-2.5 mb-6">
                {t('paymentDetailAmount')}{' '}
                <span className="font-bold text-text">
                  {formatPaid(payment.paidAmount ?? payment.totalPrice, payment.paidCurrency)}
                </span>
                {payment.paymentMethod && <> · {payment.paymentMethod}</>}
                {(payment.paymentIntentId || payment.gatewayTransactionId) && (
                  <>
                    {' · '}
                    <span className="font-mono">
                      {payment.paymentIntentId || payment.gatewayTransactionId}
                    </span>
                  </>
                )}
              </p>
            )}

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
