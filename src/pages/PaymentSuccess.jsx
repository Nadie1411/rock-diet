import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Home,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  LifeBuoy,
} from "lucide-react";
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';
import {
  usePaymentResult,
  orderRef,
  formatPaid,
  isSubscriptionPurchase,
} from '../hooks/usePaymentResult';

/**
 * Where the gateway sends the customer after a payment.
 *
 * Landing here means nothing by itself, so the page says nothing until the
 * server has asked the gateway. It then shows what was actually confirmed —
 * the amount, the method, the transaction — from the order record, not from
 * the fact of having been redirected. A payment that failed or was cancelled
 * is sent on to the failure page; a subscription purchase to the screen that
 * waits for the package to be applied.
 */

const STATUS_KEYS = {
  paid: 'paymentStatusPaid',
  pending: 'paymentStatusPending',
  failed: 'paymentStatusFailed',
  cancelled: 'paymentStatusCancelled',
  refunded: 'paymentStatusRefunded',
};

export default function PaymentSuccess() {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { orderId, order, state, message, retry } = usePaymentResult();

  // A subscription purchase has its own screen, which waits for the package
  // to be applied rather than showing a basket receipt. The order says which
  // it is; the flag checkout set is the fallback for a return with no id.
  useEffect(() => {
    let flagged = false;
    try {
      flagged = sessionStorage.getItem('pending_subscription') === '1';
    } catch {
      flagged = false;
    }
    if (isSubscriptionPurchase(order) || (flagged && state !== 'unknown')) {
      navigate(
        `/subscription/success${orderId ? `/${encodeURIComponent(orderId)}` : ''}`,
        { replace: true },
      );
    }
  }, [order, state, orderId, navigate]);

  // Not a success at all: the failure page has the right words and the way
  // back, and the server has already recorded which it was.
  useEffect(() => {
    if (state === 'failed' || state === 'cancelled' || state === 'refunded') {
      navigate(`/payment/failure/${encodeURIComponent(orderId)}`, { replace: true });
    }
  }, [state, orderId, navigate]);

  useEffect(() => {
    if (state === 'paid') {
      try {
        sessionStorage.removeItem('pending_order_id');
      } catch {
        // Nothing to clean up if storage is unavailable.
      }
    }
  }, [state]);

  if (state === 'unauthenticated') {
    return <SignInPrompt reason={t('paymentSignInToConfirm')} />;
  }

  const paidAmount = order?.paidAmount ?? order?.totalPrice;
  const transaction = order?.paymentIntentId || order?.gatewayTransactionId;
  const paidAt = order?.paidAt
    ? new Date(order.paidAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')
    : null;

  const homeLink = (
    <Link
      to="/"
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
    >
      <Home className="w-4 h-4" />{t('checkoutBackHome')}<ArrowRight className="w-4 h-4 rtl:rotate-180" />
    </Link>
  );

  const ordersLink = (
    <Link
      to="/orders"
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
    >
      <ShoppingBag className="w-4 h-4" />{t('trackYourOrder')}</Link>
  );

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
        {state === 'checking' && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/30">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('verifyingPayment')}</h1>
              <p className="text-sm text-text-secondary">{t('confirmingPayment')}</p>
            </div>
          </>
        )}

        {state === 'paid' && (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentSuccessful')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentSuccessBody')}</p>
            </div>

            {/* What the gateway confirmed, straight from the order record. */}
            <dl className="text-start text-sm bg-bg border border-border rounded-xl px-4 py-3 space-y-1.5">
              <Row label={t('paymentDetailOrder')} value={`#${orderRef(order._id)}`} mono />
              <Row label={t('paymentDetailAmount')} value={formatPaid(paidAmount, order.paidCurrency)} strong />
              <Row label={t('paymentDetailStatus')} value={t(STATUS_KEYS.paid)} tone="text-success" />
              {order.paymentMethod && (
                <Row label={t('paymentDetailMethod')} value={order.paymentMethod} />
              )}
              {transaction && (
                <Row label={t('paymentDetailTransaction')} value={transaction} mono />
              )}
              {paidAt && <Row label={t('paymentDetailPaidAt')} value={paidAt} />}
            </dl>

            <div className="space-y-2.5 pt-2">
              {ordersLink}
              {homeLink}
            </div>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentPending')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentPendingBody')}</p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={retry}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />{t('commonRetry')}</button>
              {ordersLink}
              {homeLink}
            </div>
          </>
        )}

        {state === 'held' && (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentUnderReview')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentUnderReviewBody')}</p>
              {message && <p className="text-xs text-text-secondary">{message}</p>}
            </div>
            <div className="space-y-2.5 pt-2">
              <Link
                to="/customer-service"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <LifeBuoy className="w-4 h-4" />{t('paymentContactSupport')}</Link>
              {homeLink}
            </div>
          </>
        )}

        {state === 'unknown' && (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentNotFound')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentNoOrder')}</p>
            </div>
            <div className="space-y-2.5 pt-2">
              {ordersLink}
              {homeLink}
            </div>
          </>
        )}

        {(state === 'failed' || state === 'cancelled' || state === 'refunded') && (
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/30">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false, strong = false, tone = '' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-text-secondary shrink-0">{label}</dt>
      <dd
        className={`text-end break-all ${mono ? 'font-mono text-xs' : ''} ${strong ? 'font-extrabold text-base' : 'font-semibold'} ${tone}`}
      >
        {value}
      </dd>
    </div>
  );
}
