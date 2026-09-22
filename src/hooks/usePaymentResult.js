import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { orderService } from '../services/orderService';

/**
 * What actually happened to a payment, according to the server.
 *
 * The gateway sends the customer back to a fixed page, and that proves only
 * that their browser followed a redirect. So the result pages ask the API,
 * which asks the gateway, and show whatever comes back — paid, failed,
 * cancelled, or still open. While it is still open they ask again every few
 * seconds: KNET can take a moment to settle, and a customer who lands here a
 * beat before the gateway is done must not be told their payment failed.
 *
 * The order id comes from the URL (the API puts it there when it opens the
 * charge) and falls back to what checkout stashed, for a gateway configured
 * to return without it.
 */

const POLL_MS = 4000;
const GIVE_UP_AFTER_MS = 90_000;

const SETTLED = new Set(['paid', 'failed', 'cancelled', 'refunded']);

const stashedOrderId = () => {
  try {
    return sessionStorage.getItem('pending_order_id');
  } catch {
    return null;
  }
};

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The order an Ecom return is about.
 *
 * The API now puts the id in the path (`/payment/success/<id>`), because
 * Ecom appends its own parameters to the return URL with a literal "?" —
 * an id in the query string came back as `6aa7…?product=E_API`. Older
 * links, and anything mangled that way, are trimmed at the first "?";
 * failing all that, the `paymentToken` Ecom appends identifies the payment.
 */
export const readReturnParams = ({ params, searchParams }) => {
  const raw = params?.orderId || searchParams.get('orderId') || '';
  const trimmed = raw.split('?')[0].split('&')[0].trim();
  const orderId = OBJECT_ID.test(trimmed) ? trimmed : stashedOrderId();
  // With the old URL shape the token still parses: "&" splits it off the
  // mangled orderId value.
  const paymentToken = (searchParams.get('paymentToken') || '').trim() || null;
  return { orderId: orderId || null, paymentToken };
};

/**
 * @param poll keep asking while the gateway still says "open". The success
 *   page wants that; the failure page wants one answer and then its words.
 */
export function usePaymentResult({ poll = true } = {}) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { orderId, paymentToken } = readReturnParams({ params, searchParams });
  const canAsk = Boolean(orderId || paymentToken);

  const [order, setOrder] = useState(null);
  // 'checking' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'pending'
  // | 'held' | 'unauthenticated' | 'unknown'
  const [state, setState] = useState(canAsk ? 'checking' : 'unknown');
  const [message, setMessage] = useState('');
  const startedAt = useRef(Date.now());
  const timer = useRef(null);

  const check = useCallback(async () => {
    if (!canAsk) return;
    try {
      const res = orderId
        ? await orderService.reconcilePayment(orderId)
        : await orderService.reconcileByToken(paymentToken);
      const next = res?.data || res;
      setOrder(next);
      if (SETTLED.has(next?.paymentStatus)) {
        setState(next.paymentStatus);
        return;
      }
      // Still open at the gateway. Keep asking for a while, then say so
      // rather than spinning for ever.
      setState(
        !poll || Date.now() - startedAt.current > GIVE_UP_AFTER_MS
          ? 'pending'
          : 'checking',
      );
    } catch (err) {
      if (err?.status === 401) {
        setState('unauthenticated');
        return;
      }
      if (err?.status === 409) {
        // The money moved but does not match the order. Nothing here can
        // fix that; a person has to look. Stop asking.
        setMessage(err.message || '');
        setState('held');
        return;
      }
      if (err?.status === 404) {
        setState('unknown');
        return;
      }
      // Network or server trouble: leave the state as it is and try again.
    }
  }, [orderId, paymentToken, canAsk, poll]);

  useEffect(() => {
    if (!canAsk) return undefined;
    check();
    return () => clearTimeout(timer.current);
  }, [canAsk, check]);

  useEffect(() => {
    if (state !== 'checking') return undefined;
    timer.current = setTimeout(check, POLL_MS);
    return () => clearTimeout(timer.current);
    // `order` is in the list so a "still open" answer schedules the next ask.
  }, [state, order, check]);

  const retry = useCallback(() => {
    startedAt.current = Date.now();
    setState('checking');
    check();
  }, [check]);

  // The id the pages link with: what the URL said, or what the server
  // answered when only the token was known.
  return { orderId: orderId || order?._id || null, order, state, message, retry };
}

/** "KD 14.500" for dinar, the ISO code for anything else. */
export const formatPaid = (amount, currency) => {
  if (amount == null) return '';
  const code = String(currency || 'KWD').toUpperCase();
  return `${code === 'KWD' ? 'KD' : code} ${Number(amount).toFixed(3)}`;
};

/** The order's short reference, the same one the emails and the panel use. */
export const orderRef = (id) => String(id || '').slice(-8).toUpperCase();

export const isSubscriptionPurchase = (order) =>
  order?.source === 'subscription_purchase';
