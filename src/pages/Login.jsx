import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AtSign, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { hasDraft } from '../utils/subscribeDraft';
import rockDietLogo from '../assets/rock-diet-logo.png';
import { useT } from '../i18n/useT';

export default function Login() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identity || !password) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await login(identity, password);
      // Back to what they were doing. An unfinished subscription counts on
      // its own: they reached this screen from the pay button, and landing on
      // the home page instead means finding the wizard again from scratch.
      const from = location.state?.from || (hasDraft() ? '/subscribe' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Login failed. Please try again.');
      } else {
        setError(t('networkErrorLong'));
      }
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            {t('headingWelcome')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t('loginSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-start gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or phone. Not type="email": the browser would refuse a
                phone number as malformed before the form ever submitted. */}
            <div>
              <label htmlFor="identity" className="block text-xs font-semibold text-text mb-1.5">{t('emailOrPhone')}</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="identity"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  dir="ltr"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder={t('authIdentityHint')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text mb-1.5">{t('authPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >{t('authForgot')}</Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{t('loggingIn')}</>
              ) : (
                t('authLogin')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">{t('authOr')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Signup link */}
          <p className="text-center text-sm text-text-secondary">
            {t('authNoAccount')}{' '}
            <Link to="/signup" className="font-semibold text-primary hover:text-primary-light transition-colors">{t('signUp')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}