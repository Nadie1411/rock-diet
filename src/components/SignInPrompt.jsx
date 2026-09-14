import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useAuthGate } from '../context/AuthGate';
import { useT } from '../i18n/useT';

/**
 * What a page shows a guest instead of throwing them at /login.
 *
 * They asked for this page, so they land on it and are told what signing in
 * would give them. Redirecting instead loses the destination and the reason
 * at once, and the back button walks straight into the same bounce.
 */
export default function SignInPrompt({ reason }) {
  const { t } = useT();
  const { requireAuth } = useAuthGate();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
          <LogIn className="w-6 h-6 rtl:rotate-180" />
        </span>

        <h1 className="text-xl font-extrabold mb-2">{t('authGateTitle')}</h1>
        <p className="text-sm text-text-secondary mb-6">
          {reason || t('authGateGeneric')}
        </p>

        <button
          type="button"
          onClick={() => requireAuth(null, { reason })}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
        >
          {t('authLogin')}
        </button>

        <p className="text-xs text-text-secondary mt-4">
          {t('authNoAccount')}{' '}
          <Link to="/signup" className="font-bold text-primary hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
