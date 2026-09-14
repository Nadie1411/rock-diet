import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * Changing a password you still know.
 *
 * Separate from the reset flow: that one proves ownership of the address with
 * a code because the password is lost, this one proves it with the current
 * password. Both end the same way — every other session is refused, because
 * `passwordChangedAt` is compared against each token's `iat`.
 */

const PASSWORD_RULE =
  // Length only. The server asks for eight characters and nothing more, and a
// stricter rule here would reject passwords it would happily accept.
/^.{8,}$/;

export default function ChangePassword() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);


  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError(t('enterCurrentPassword'));
      return;
    }
    if (!PASSWORD_RULE.test(newPassword)) {
      setError(
        'New password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&).',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t('passwordMustDiffer'));
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-bg text-text flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">{t('passwordChanged')}</h1>
          <p className="text-text-secondary text-sm mb-6">{t('pwdChangedAllSignedOut')}</p>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >{t('signInAgain')}</button>
        </div>
      </div>
    );
  }


  // Waits for the session check before deciding: a restored session that
  // has not resolved yet must not be mistaken for a guest.
  if (authLoading) return null;
  if (!isAuthenticated) return <SignInPrompt reason={t('authGateGeneric')} />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-10">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5"
        >
          <ArrowLeft className="w-4 h-4" />{t('navProfile')}</Link>

        <h1 className="text-2xl font-extrabold mb-1">{t('authResetAction')}</h1>
        <p className="text-text-secondary text-sm mb-6">{t('signedOutElsewhere')}</p>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="bg-surface border border-border rounded-2xl p-6 space-y-4"
        >
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={show}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            show={show}
            autoComplete="new-password"
            toggle={() => setShow((s) => !s)}
            hint="At least 8 characters, with an uppercase and a lowercase letter, a number and one of @$!%*?&."
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={show}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Change password
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-5">
          Forgotten it instead?{' '}
          <Link to="/forgot-password" className="text-primary font-semibold hover:underline">{t('resetByEmail')}</Link>
        </p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, autoComplete, toggle, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full pl-9 ${toggle ? 'pr-10' : 'pr-3'} py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary`}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
            aria-label={show ? 'Hide passwords' : 'Show passwords'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-text-secondary mt-1.5">{hint}</p>}
    </div>
  );
}
