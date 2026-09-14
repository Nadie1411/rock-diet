import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

import { authService } from '../services/authService';
import { useT } from '../i18n/useT';

/**
 * Password reset, in one screen with two steps.
 *
 * Kept together rather than split across routes because the second step needs
 * the address from the first — sending someone to a bare "enter your code"
 * page loses it, and asking for the email twice reads as though the first
 * answer went nowhere.
 *
 * The request step's message is deliberately the same whether or not the
 * address has an account. Confirming that an email is registered, on an
 * endpoint needing no sign-in, hands out a list of who is a customer.
 */

const PASSWORD_RULE =
  // Length only. The server asks for eight characters and nothing more, and a
// stricter rule here would reject passwords it would happily accept.
/^.{8,}$/;

export default function ForgotPassword() {
  const { t, L } = useT();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('enterEmailDot'));
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      // Move on regardless of what came back: the server answers the same way
      // for an address with no account, and branching here would leak the
      // difference it is careful not to.
      setStep(1);
    } catch (err) {
      setError(err?.message || 'Could not send a reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
    } catch {
      // Same reasoning as above — nothing to report either way.
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError(t('codeIsSixDigits'));
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError(
        'Password must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&).',
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(t('authPasswordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp,
        password,
        confirmPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err?.message || 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-bg text-text flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">{t('passwordChanged')}</h1>
          <p className="text-text-secondary text-sm mb-6">{t('pwdResetSignedOut')}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >{t('goToSignIn')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => (step === 0 ? navigate('/login') : setStep(0))}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />{t('commonBack')}</button>

        <header className="text-center mb-8">
          <h1 className="text-2xl font-extrabold">
            {step === 0 ? 'Forgot your password?' : 'Enter your code'}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {step === 0
              ? "Enter your email and we'll send a six-digit reset code."
              : `If ${email} has an account, a code is on its way. It expires shortly.`}
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-6">
          {step === 0 ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">{t('emailAddressLower')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('authEmailHint')}
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset code
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">{t('sixDigitCode')}</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg text-sm tracking-[0.3em] font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">{t('authNewPassword')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-text-secondary mt-1.5">{t('pwdRuleHint')}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">{t('confirmNewPassword')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Set new password
              </button>

              <button
                type="button"
                onClick={resend}
                disabled={loading}
                className="w-full text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >{t('resendCodePrompt')}</button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">{t('authSignIn')}</Link>
        </p>
      </div>
    </div>
  );
}
