import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Info,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * Your details.
 *
 * Only the fields the API will actually accept are here. Measurements live on
 * the plan settings screen instead, because changing them is really a change
 * to the calorie target rather than to who you are — and the email is shown
 * but not editable, since it is what proves the account is yours.
 */
export default function EditProfile() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');


  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhoneNumber(user.phoneNumber || '');
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved('');

    const payload = {};
    if (firstName.trim()) payload.firstName = firstName.trim();
    if (lastName.trim()) payload.lastName = lastName.trim();
    if (phoneNumber.trim()) payload.phoneNumber = phoneNumber.trim();

    if (!Object.keys(payload).length) {
      setError(t('nothingToSave'));
      return;
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      setSaved(t('yourDetailsSaved'));
    } catch (err) {
      setError(err?.message || 'Could not save your details.');
    } finally {
      setSaving(false);
    }
  };

  // Session first. Only once we know they are a guest can the ask be
  // shown - and it must come before any data gate, because the data these
  // pages load is exactly what a guest never fetches, so `loading` would
  // stay true forever and leave them on a spinner that never resolves.
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <SignInPrompt reason={t('authGatePlan')} />;

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5"
        >
          <ArrowLeft className="w-4 h-4" />{t('navProfile')}</Link>

        <h1 className="text-2xl font-extrabold mb-6">{t('yourDetails')}</h1>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saved}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="bg-surface border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{t('firstName')}</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setSaved('');
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{t('lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setSaved('');
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{t('authPhoneLabel')}</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setSaved('');
                }}
                placeholder="+96550000000"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5">{t('phoneHint')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{t('profileEmail')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg/50 text-sm text-text-secondary cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5">{t('emailLocked')}</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save details
          </button>
        </form>

        <p className="flex items-start gap-2 text-xs text-text-secondary mt-4">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Age, weight, height and activity are on{' '}
          <Link to="/plan/manage" className="text-primary font-semibold">
            plan settings
          </Link>
          , since they set your calorie target.
        </p>
      </div>
    </div>
  );
}
