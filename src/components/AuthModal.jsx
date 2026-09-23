import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

/**
 * Signing in without leaving the page.
 *
 * Only the sign-in form lives here. Registering asks for height, weight,
 * activity and a goal — a form that does not belong in a sheet over the thing
 * you were doing — so "create an account" hands over to the full page. It is
 * given its own button rather than a link, because plenty of people meeting
 * this sheet have no account yet and that is the door they need.
 */
export default function AuthModal({ reason, onClose }) {
  const { t } = useT();
  const { login } = useAuth();

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const identityRef = useRef(null);
  const dialogRef = useRef(null);

  // Straight into the first field: this opened because they pressed
  // something, so it should cost one keystroke to carry on, not a hunt for
  // where to type.
  useEffect(() => {
    identityRef.current?.focus();
  }, []);

  // Escape closes it, like every other sheet on the web.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The page behind must not scroll while this is over it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identity, password);
      // Not closed here. AuthGate closes it once the app is actually in the
      // signed-in state, and replays whatever this interrupted.
    } catch (err) {
      setError(err?.message || t('networkError'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        className="w-full sm:max-w-sm bg-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in"
      >
        <header className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <h2 id="auth-gate-title" className="text-lg font-extrabold">
              {t('authGateTitle')}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {reason || t('authGateGeneric')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface shrink-0"
            aria-label={t('commonClose')}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={submit} className="px-5 pb-5 space-y-3">
          {error && (
            <p className="flex items-start gap-2 p-3 rounded-xl bg-error/10 text-error text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Email or phone, like the sign-in page: the same customers reach
              this modal, and half of them have only a number. Not
              type="email", which would refuse a phone number as malformed
              before the form could submit. */}
          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">
              {t('emailOrPhone')}
            </span>
            <input
              ref={identityRef}
              type="text"
              inputMode="email"
              required
              autoComplete="username"
              dir="ltr"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder={t('authIdentityHint')}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-text-secondary">
              {t('authPassword')}
            </span>
            <span className="relative block">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-3 pe-11 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={t('authPassword')}
                className="absolute end-3 top-1/2 -translate-y-1/2 mt-0.5 p-1 text-text-secondary hover:text-text"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('loggingIn') : t('authLogin')}
          </button>

          <p className="text-center pt-1">
            <Link
              to="/forgot-password"
              onClick={onClose}
              className="text-xs text-text-secondary hover:text-primary"
            >
              {t('authForgot')}
            </Link>
          </p>

          {/* Creating an account is the other half of this sheet, not a
              footnote to it. Most people meeting it for the first time do not
              have an account yet, and a grey link under the fold asked them
              to hunt for the one thing they actually needed. */}
          <div className="flex items-center gap-3 pt-2">
            <span className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-text-secondary">{t('authOr')}</span>
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="text-center">
            <p className="text-xs text-text-secondary mb-2">{t('authNewHere')}</p>
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-on-primary transition-colors"
            >
              {t('authCreateAccount')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-text-secondary hover:text-text"
          >
            {t('authKeepBrowsing')}
          </button>
        </form>
      </div>
    </div>
  );
}
