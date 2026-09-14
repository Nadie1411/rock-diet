import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useT } from '../i18n/useT';
import { isChangingPlan } from '../utils/changePlanIntent';

/**
 * Guards the screens that offer packages.
 *
 * A customer with a running subscription has already chosen and paid. Showing
 * them the picker again invites them to buy something they have, so these
 * routes open only when there is no active plan, or when they have explicitly
 * asked to change it.
 *
 * Fails closed. The question is "may this person be shown the picker?", and
 * the only answer that opens it is a definite no-active-plan from the server.
 * An earlier version treated a failed status read as "no plan" and put the
 * picker in front of a paying customer the moment the API rate-limited — so
 * "we could not check" now gets its own screen rather than the benefit of the
 * doubt.
 */
export default function RequirePlanChoice({ children }) {
  const location = useLocation();
  const { t } = useT();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasActivePlan, known, error, loading, refresh } = useSubscription();

  // A guest has nothing to protect: they are browsing, and the pages ask for
  // a sign-in at the point it is needed.
  if (!authLoading && !isAuthenticated) return children;

  if (authLoading || (loading && !known)) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Asked, and could not find out. Offering the picker here risks selling a
  // second subscription to someone who already has one, so it stays shut and
  // says why.
  if (!known && error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warning/10 text-warning mb-5">
            <AlertCircle className="w-6 h-6" />
          </span>
          <h1 className="text-lg font-extrabold mb-2">{t('planCheckFailed')}</h1>
          <p className="text-sm text-text-secondary mb-6">
            {t('planCheckFailedBody')}
          </p>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t('commonRetry')}
          </button>
        </div>
      </div>
    );
  }

  if (hasActivePlan && !isChangingPlan()) {
    return <Navigate to="/plan" replace state={{ from: location.pathname }} />;
  }

  // The invariant, stated once: the picker opens on a definite answer and on
  // nothing else. Without this an unforeseen combination of flags could still
  // fall through to it, which is how the previous version failed.
  if (!known) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return children;
}
