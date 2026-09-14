import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, CalendarCheck, AlertCircle } from 'lucide-react';

import { packageService } from '../services/packageService';
import { settingsService } from '../services/settingsService';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import { targetCalories, DEFAULT_CALORIE_CONFIG } from '../utils/calories';
import PackageCard, { approximateDailyCalories } from '../components/PackageCard';
import { useT } from '../i18n/useT';
import { useAuthGate } from '../context/AuthGate';

export default function Packages() {
  const { t, L, lang } = useT();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [packages, setPackages] = useState([]);
  const [calorieConfig, setCalorieConfig] = useState(DEFAULT_CALORIE_CONFIG);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([
      packageService.getPackages(),
      settingsService.getPublicSettings().catch(() => null),
    ])
      .then(([pkgRes, settingsRes]) => {
        if (!mounted) return;
        setPackages(pkgRes.data || []);
        const cfg = settingsRes?.data?.calories;
        if (cfg) setCalorieConfig(cfg);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Could not load packages.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Only meaningful for someone signed in — it reports their own subscription.
  useEffect(() => {
    if (!isAuthenticated) {
      setStatus(null);
      return;
    }
    let mounted = true;
    subscriptionService
      .getStatus()
      .then((res) => {
        if (mounted) setStatus(res.data || null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  /**
   * The package closest to what this customer should be eating.
   *
   * Only shown to someone signed in, because it is computed from their own
   * metrics — there is nothing to base it on for a visitor, and a guessed
   * recommendation is worse than none.
   */
  const recommendedSlug = useMemo(() => {
    if (!user) return null;
    const target = targetCalories(user, user.goal, calorieConfig);
    if (!target) return null;

    const candidates = packages.filter((p) => !p.trial);
    if (!candidates.length) return null;

    return candidates.reduce((best, p) =>
      Math.abs(approximateDailyCalories(p) - target) <
      Math.abs(approximateDailyCalories(best) - target)
        ? p
        : best,
    ).slug;
  }, [packages, user, calorieConfig]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            {t('headingPackages')}
          </h1>
          <p className="text-text-secondary mt-2">{t('packagesSubtitle')}</p>
        </header>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-6 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/*
          Only a customer who asked to change plan gets here with one running,
          so this says what is actually about to happen. It used to promise
          the new package would "take effect when this term ends", which was
          never true: a package change is a purchase, and nothing moves until
          it is paid for.
        */}
        {status?.active && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-warning/10 border border-warning/20">
            <CalendarCheck className="w-5 h-5 text-warning mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-text">
                {t('changingFromPlan', { plan: L(status.package) || t('planNoSubscription') })}
              </p>
              <p className="text-text-secondary mt-0.5">
                {status.subscriptionEnd
                  ? `${t('runsUntil', { date: new Date(status.subscriptionEnd).toLocaleDateString(lang === 'ar' ? 'ar' : 'en') })}. `
                  : ''}
                {t('changingPlanNote')}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.slug}
              pkg={pkg}
              recommended={pkg.slug === recommendedSlug}
              onSelect={() =>
                navigate(
                  `/subscribe?package=${encodeURIComponent(pkg.slug)}`,
                )
              }
            />
          ))}
        </div>

        {!packages.length && !error && (
          <p className="text-center text-text-secondary py-12">{t('noPackages')}</p>
        )}

        <div className="mt-8 text-center">
          {isAuthenticated ? (
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
            >{t('buildMyPlan')}<ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <p className="text-sm text-text-secondary">
              <button
                type="button"
                onClick={() => requireAuth(null, { reason: t('authGateGeneric') })}
                className="text-primary font-semibold hover:underline"
              >{t('authSignIn')}</button>{' '}
              {t('packagesSignInPrompt')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
