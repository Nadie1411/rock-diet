import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  CalendarDays,
  Utensils,
  Flame,
  ChevronRight,
  Settings2,
  ArrowRight,
} from 'lucide-react';

import { subscriptionService } from '../services/subscriptionService';
import { packageService } from '../services/packageService';
import { useAuth } from '../context/AuthContext';
import { approximateDailyCalories } from '../components/PackageCard';
import { useT } from '../i18n/useT';
import { beginChangePlan } from '../utils/changePlanIntent';
import SignInPrompt from '../components/SignInPrompt';

/**
 * The subscription dashboard: what you're on, how long is left, and the few
 * things that need doing from here — pausing, editing the week, changing
 * package.
 *
 * Pausing is confirmed rather than done on the tap, because the server also
 * removes the boxes already scheduled for the days ahead. Doing that silently
 * is how someone loses a week of food by pressing the wrong thing.
 */
export default function Plan() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading, refreshProfile } = useAuth();

  const [status, setStatus] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [changing, setChanging] = useState(false);
  const changeRef = useRef(null);

  // Bring the confirmation into view when it opens. It replaces the button
  // in place, low on a long page, so on a phone the press produced no
  // visible change and read as a dead button.
  useEffect(() => {
    if (changing) {
      changeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [changing]);
  const [working, setWorking] = useState(false);


  const load = useCallback(() => {
    if (!isAuthenticated) return;
    subscriptionService
      .getStatus()
      .then(async (res) => {
        const s = res.data || null;
        setStatus(s);
        if (s?.package) {
          const p = await packageService
            .getPackageBySlug(s.package)
            .catch(() => null);
          setPkg(p?.data || null);
        }
      })
      .catch((err) => setError(err?.message || t('planLoadError')))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const paused = Boolean(user?.subscriptionPaused);

  const daysLeft = useMemo(() => {
    if (!status?.subscriptionEnd) return null;
    const ms = new Date(status.subscriptionEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86400000));
  }, [status]);

  const mealsPerDay = useMemo(() => {
    const slots = user?.packageSelection?.slots;
    if (Array.isArray(slots) && slots.length) {
      return slots.reduce((sum, s) => sum + (s.count ?? 0), 0);
    }
    return pkg?.defaultMealsPerDay ?? null;
  }, [user, pkg]);

  const togglePause = async () => {
    setWorking(true);
    setError('');
    setNote('');
    try {
      const res = await subscriptionService.pause(!paused);
      const removed = res.data?.ordersRemoved ?? 0;
      setNote(
        res.data?.paused
          ? removed > 0
            ? `Deliveries paused. ${removed} upcoming ${removed === 1 ? 'box' : 'boxes'} cancelled.`
            : 'Deliveries paused.'
          : 'Deliveries resumed.',
      );
      setConfirming(false);
      await refreshProfile?.().catch(() => {});
      load();
    } catch (err) {
      setError(err?.message || t('planChangeError'));
    } finally {
      setWorking(false);
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Nothing bought yet, or a term that has run out.
  if (!status?.active) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <CalendarDays className="w-10 h-10 mx-auto text-text-secondary/40 mb-4" />
          <h1 className="text-2xl font-extrabold mb-2">
            {status?.expired ? t('planEnded') : t('planNoSubscription')}
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            {status?.expired
              ? t('planEndedDesc')
              : t('planNoSubscriptionDesc')}
          </p>
          <Link
            to="/packages"
            className="inline-flex px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >
            {status?.expired ? t('planRenewCta') : t('packageBrowse')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold mb-5">{t('navPlan')}</h1>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {note && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{note}</span>
          </div>
        )}

        {/* Summary. Brand colours while running, muted while paused — the
            state should be readable before any words are. */}
        <div
          className={`rounded-2xl p-6 text-white shadow-lg ${
            paused
              ? 'bg-gradient-to-br from-slate-700 to-slate-900'
              : 'bg-gradient-to-br from-primary to-secondary'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold truncate">
                {pkg ? L(pkg.name) : status.package}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold shrink-0">
              {paused ? (
                <PauseCircle className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {paused ? t('planStatusPaused') : t('planStatusActive')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Metric
              Icon={Utensils}
              value={mealsPerDay ?? '—'}
              label="meals a day"
            />
            <Metric
              Icon={Flame}
              value={pkg ? approximateDailyCalories(pkg).toLocaleString() : '—'}
              label="kcal a day"
            />
            <Metric
              Icon={CalendarDays}
              value={daysLeft ?? '—'}
              label="days left"
            />
          </div>

          {status.subscriptionEnd && (
            <p className="text-xs text-white/70 mt-5">
              {status.duration ? `${status.duration} · ` : ''}runs until{' '}
              {new Date(status.subscriptionEnd).toLocaleDateString()}
            </p>
          )}
        </div>

        {paused && (
          <div className="flex items-start gap-2 p-4 mt-4 rounded-xl bg-warning/10 text-sm">
            <PauseCircle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
            <span>{t('planPausedBody')}</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <Action
            to="/week-plan"
            title={t('editThisWeek')}
            hint={t('planChooseDaily')}
          />
          <Action
            to="/plan/manage"
            title={t('planSettings')}
            hint={t('planPortionsMeasures')}
            Icon={Settings2}
          />
          <Action
            to="/restrictions"
            title={t('restrictionsTitle')}
            hint={t('planMustNotSend')}
          />
          <Action
            to="/delivery"
            title={t('planEditAddress')}
            hint={t('planWhereBoxesGo')}
          />
        </div>

        {/*
          The only door to the package picker for someone already subscribed.
          Deliberately a confirmation rather than a link: the picker is
          otherwise unreachable for them, and changing plan costs money, so it
          should not be one stray tap away.

          Granting the intent only shows the plans. The subscription itself
          changes when the gateway confirms a payment and not before — if they
          abandon it, this plan is still the one running.
        */}
        <div ref={changeRef} className="mt-6 rounded-2xl border border-border bg-surface p-5">
          {changing ? (
            <>
              <h3 className="font-bold text-sm mb-1">{t('changePlanTitle')}</h3>
              <p className="text-xs text-text-secondary mb-4">{t('changePlanBody')}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChanging(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
                >{t('keepAsIs')}</button>
                <button
                  type="button"
                  onClick={() => {
                    beginChangePlan();
                    navigate('/packages');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
                >
                  {t('changePlanConfirm')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                  {t('currentPlanLabel')}
                </p>
                <p className="font-bold text-sm truncate">
                  {(pkg ? L(pkg.name) : status?.package) ||
                    t('planNoSubscription')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChanging(true)}
                className="shrink-0 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
              >{t('changePlan')}</button>
            </div>
          )}
        </div>

        {/* Pause / resume */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          {confirming ? (
            <>
              <h3 className="font-bold text-sm mb-1">
                {paused ? t('resumeTitle') : t('pauseTitle')}
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                {paused
                  ? t('planResumeBody')
                  : t('planPauseBody')}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={working}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors disabled:opacity-50"
                >{t('keepAsIs')}</button>
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={working}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                    paused ? 'bg-success hover:bg-success/90' : 'bg-warning hover:bg-warning/90'
                  }`}
                >
                  {working && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paused ? t('resumeYes') : t('pauseYes')}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
            >
              {paused ? (
                <PlayCircle className="w-4 h-4" />
              ) : (
                <PauseCircle className="w-4 h-4" />
              )}
              {paused ? t('resumeAction') : t('pauseAction')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ Icon, value, label }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 mx-auto text-white/60 mb-1" />
      <p className="text-xl font-extrabold tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-white/70 mt-1">{label}</p>
    </div>
  );
}

function Action({ to, title, hint, Icon = ChevronRight }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-colors"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-text-secondary mt-0.5">{hint}</span>
      </span>
      <Icon className="w-4 h-4 text-text-secondary shrink-0" />
    </Link>
  );
}
