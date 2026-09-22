import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  XCircle,
  Home,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Ban,
  CalendarDays,
} from "lucide-react";
import { useT } from '../i18n/useT';
import {
  usePaymentResult,
  orderRef,
  isSubscriptionPurchase,
} from '../hooks/usePaymentResult';

/**
 * Where the gateway sends the customer when a payment did not go through.
 *
 * Also served at /payment/cancel. The gateway's redirect only says the
 * customer left its page; whether they backed out, were declined, or in fact
 * paid comes from asking the server, which asks the gateway and records the
 * answer. So a customer sent here after a capture is passed on to the
 * success page, and the words distinguish a cancellation from a decline.
 */
export default function PaymentFailure() {
  const { t } = useT();
  const navigate = useNavigate();
  // One answer is enough here: a payment the gateway still calls open was
  // abandoned, and the customer should see the way back, not a spinner.
  const { orderId, order, state } = usePaymentResult({ poll: false });

  useEffect(() => {
    if (state === 'paid') {
      navigate(`/payment/success/${encodeURIComponent(orderId)}`, { replace: true });
    }
  }, [state, orderId, navigate]);

  const cancelled = state === 'cancelled';
  // Neither captured nor closed at the gateway: they left its page.
  const abandoned = state === 'pending';
  const checking = state === 'checking';
  const subscription = isSubscriptionPurchase(order);

  const heading = cancelled
    ? t('paymentCancelled')
    : abandoned
      ? t('paymentNotCompleted')
      : t('paymentFailed');
  const body = cancelled
    ? t('paymentCancelledBody')
    : abandoned
      ? t('paymentNotCompletedBody')
      : t('paymentFailedBody');

  // The way back: the basket is still saved for a cart order, and a term is
  // chosen again from the wizard.
  const tryAgain = subscription ? (
    <Link
      to="/subscribe"
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
    >
      <CalendarDays className="w-4 h-4" />{t('paymentTryAgainPlan')}</Link>
  ) : (
    <Link
      to="/menu"
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
    >
      <ShoppingBag className="w-4 h-4" />{t('tryAgainBrowse')}</Link>
  );

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
        {checking ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/30">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('verifyingPayment')}</h1>
              <p className="text-sm text-text-secondary">{t('confirmingPayment')}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto border border-error/30">
              {cancelled ? <Ban className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{heading}</h1>
              <p className="text-sm text-text-secondary">{body}</p>
              {order && (
                <p className="text-xs text-text-secondary">
                  {t('paymentDetailOrder')} <span className="font-mono">#{orderRef(order._id)}</span>
                  {' · '}
                  {t('paymentDetailStatus')}{' '}
                  <span className={`font-semibold ${abandoned ? 'text-warning' : 'text-error'}`}>
                    {cancelled
                      ? t('paymentStatusCancelled')
                      : abandoned
                        ? t('paymentStatusPending')
                        : t('paymentStatusFailed')}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              {tryAgain}
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
              >
                <Home className="w-4 h-4" />{t('checkoutBackHome')}<ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
