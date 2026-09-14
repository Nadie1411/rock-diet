import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

/**
 * The one place the app asks "what has this customer paid for?".
 *
 * The server owns the answer. A subscription starts in `markOrderPaid`, which
 * runs only from the gateway's webhook or the reconcile on return — never
 * from choosing a package or opening a payment. So this reads that state and
 * never infers it: nothing here may conclude a plan is active because the UI
 * did something.
 *
 * Screens read `activePlan` from here rather than each fetching status, so
 * two of them can never disagree about what is running.
 */
const SubscriptionContext = createContext(null);

const NONE = {
  active: false,
  expired: false,
  package: null,
  duration: null,
  subscriptionStart: null,
  subscriptionEnd: null,
};

export function SubscriptionProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // `null` means unknown — not "no subscription". They are different answers
  // and only one of them is safe to act on.
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      // A guest has no subscription, and that is a definite answer.
      setStatus(NONE);
      setError(false);
      setLoading(false);
      return NONE;
    }
    setLoading(true);
    try {
      const res = await subscriptionService.getStatus();
      const next = { ...NONE, ...(res.data || {}) };
      setStatus(next);
      setError(false);
      return next;
    } catch {
      // A failed read is "we do not know", never "no subscription". Falling
      // back to "none" here once put the package picker in front of a paying
      // customer during a rate limit — the read 429'd, the guard read the
      // empty default as "no plan", and let them through to buy again.
      // Unknown stays unknown, and callers decide what to do with that.
      setStatus(null);
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      status: status ?? NONE,
      loading,
      // True only when the server has actually answered. A guard that cannot
      // tell "no plan" from "could not ask" will eventually show the picker
      // to someone who has already paid.
      known: status !== null,
      error,
      refresh,
      hasActivePlan: Boolean(status?.active),
      activePlan: status?.active ? status.package : null,
    }),
    [status, loading, error, refresh],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used inside SubscriptionProvider');
  }
  return ctx;
}
