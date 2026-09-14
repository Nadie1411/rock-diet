import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import rockDietLogo from '../assets/rock-diet-logo.png';
import { useT } from '../i18n/useT';

export default function ConfirmEmail() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmEmail, resendOtp } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(t('enterEmail'));
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError(t('otpSixDigits'));
      return;
    }

    setLoading(true);
    try {
      await confirmEmail(email.trim(), otp);
      setSuccess(t('emailConfirmedNowLogin'));
      // Carry the destination through, so someone who started a subscription
      // is returned to it rather than dropped on the home page with a
      // half-built purchase to find again.
      const from = location.state?.from;
      setTimeout(
        () => navigate('/login', from ? { state: { from } } : undefined),
        2000,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to confirm email');
      } else {
        setError(t('networkErrorLong'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError(t('enterEmailFirst'));
      return;
    }

    setResending(true);
    try {
      await resendOtp(email.trim());
      setSuccess('OTP sent! Check your email inbox.');
      setCountdown(120);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to resend OTP');
      } else {
        setError(t('networkErrorLong'));
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />{t('commonBack')}</button>

        {/* Header */}
        <div className="text-center mb-8">
          <img src={rockDietLogo} alt={t('appName')} className="h-12 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-text">{t('otpVerify')}{' '}<span className="text-primary">{t('profileEmail')}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t('otpIntro')}</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-start gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-2 bg-success/10 text-success text-xs font-semibold px-4 py-3 rounded-lg border border-success/30">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text mb-1.5">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('authEmailHint')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* OTP */}
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-text mb-1.5">{t('otpCode')}</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-lg bg-bg border border-border text-text text-center text-2xl font-bold tracking-[0.5em] placeholder:text-text-secondary placeholder:text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{t('verifying')}</>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-xs text-text-secondary mb-3">{t('didntGetCode')}</p>
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-light transition-colors disabled:text-disabled disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{t('sending')}</>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />{t('resendOtp')}</>
              )}
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-text-secondary mt-6">
            Already confirmed?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}