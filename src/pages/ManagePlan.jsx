import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Info,
} from 'lucide-react';

import { subscriptionService } from '../services/subscriptionService';
import { packageService } from '../services/packageService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { targetCalories, DEFAULT_CALORIE_CONFIG } from '../utils/calories';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * Plan settings — the portions and the measurements behind them.
 *
 * Two different things are saved here and they go to different places:
 * portions are part of the package selection (`PATCH /user/package-selection`)
 * and take effect when the term already paid for ends; measurements are
 * account fields (`PATCH /user`) and only feed the calorie calculation.
 * Keeping them on one screen but saving them separately is deliberate —
 * changing your weight should not silently re-price your food.
 */

const SLOT_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const ACTIVITY = [
  { value: 'sedentary', labelKey: 'activitySedentary' },
  { value: 'light', labelKey: 'activityLight' },
  { value: 'moderate', labelKey: 'activityModerate' },
  { value: 'active', labelKey: 'activityActive' },
  { value: 'very_active', labelKey: 'activityVeryActive' },
];

const GOALS = [
  { value: 'weight_loss', labelKey: 'planGoalWeightLoss' },
  { value: 'maintenance', labelKey: 'calorieMaintenance' },
  { value: 'bulking', labelKey: 'muscleGain' },
];

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

export default function ManagePlan() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user,
    loading: authLoading,
    updateProfile,
    refreshProfile,
  } = useAuth();

  const [status, setStatus] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [calorieConfig, setCalorieConfig] = useState(DEFAULT_CALORIE_CONFIG);

  const [protein, setProtein] = useState(null);
  const [carbs, setCarbs] = useState(null);
  const [slots, setSlots] = useState([]);
  const [preview, setPreview] = useState(null);

  const [profile, setProfile] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintenance',
  });

  const [loading, setLoading] = useState(true);
  const [savingPortions, setSavingPortions] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');


  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      age: user.age ?? p.age,
      weight: user.weight ?? p.weight,
      height: user.height ?? p.height,
      gender: user.gender ?? p.gender,
      activityLevel: user.activityLevel ?? p.activityLevel,
      goal: user.goal ?? p.goal,
    }));
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      subscriptionService.getStatus(),
      settingsService.getPublicSettings().catch(() => null),
    ])
      .then(async ([statusRes, settingsRes]) => {
        const s = statusRes.data || null;
        setStatus(s);
        const cfg = settingsRes?.data?.calories;
        if (cfg) setCalorieConfig(cfg);

        if (s?.package) {
          const res = await packageService.getPackageBySlug(s.package).catch(() => null);
          const p = res?.data || null;
          setPkg(p);
          if (p) {
            const selection = user?.packageSelection;
            setProtein(selection?.protein ?? p.protein?.grams ?? null);
            setCarbs(selection?.carbs ?? p.carbs?.grams ?? null);
            setSlots(
              (p.slots || []).map((spec) => {
                const chosen = selection?.slots?.find((x) => x.slot === spec.slot);
                return {
                  slot: spec.slot,
                  enabled: chosen ? (chosen.count ?? 0) > 0 : spec.enabled !== false,
                  count: chosen?.count ?? spec.defaultCount ?? 1,
                };
              }),
            );
          }
        }
      })
      .catch((err) => setError(err?.message || 'Could not load your plan.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const selection = useMemo(
    () => ({
      protein,
      carbs,
      slots: slots.map(({ slot, enabled, count }) => ({ slot, enabled, count })),
    }),
    [protein, carbs, slots],
  );

  // Same rule as the wizard: the server decides what the selection really is
  // and what a day of it costs.
  useEffect(() => {
    if (!pkg || protein == null || carbs == null) return;
    const timer = setTimeout(() => {
      packageService
        .previewSelection(pkg.slug, selection)
        .then((res) => setPreview(res.data || null))
        .catch(() => setPreview(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [pkg, selection, protein, carbs]);

  const setSlotCount = (slotName, delta) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slot !== slotName) return s;
        const spec = pkg?.slots?.find((x) => x.slot === slotName);
        const max = spec?.maxCount ?? 2;
        const count = Math.min(Math.max((s.count ?? 0) + delta, 0), max);
        return { ...s, count, enabled: count > 0 };
      }),
    );
  };

  const savePortions = async () => {
    if (!pkg) return;
    setSavingPortions(true);
    setError('');
    setNote('');
    try {
      await subscriptionService.setPackageSelection({
        slug: pkg.slug,
        selection,
      });
      setNote(t('portionsSaved'));
      await refreshProfile?.().catch(() => {});
    } catch (err) {
      setError(err?.message || 'Could not save your portions.');
    } finally {
      setSavingPortions(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setError('');
    setNote('');
    try {
      await updateProfile({
        age: Number(profile.age),
        weight: Number(profile.weight),
        height: Number(profile.height),
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
      setNote(t('measurementsSaved'));
    } catch (err) {
      setError(err?.message || 'Could not save your measurements.');
    } finally {
      setSavingProfile(false);
    }
  };

  const calories = targetCalories(profile, profile.goal, calorieConfig);

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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link
          to="/plan"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5"
        >
          <ArrowLeft className="w-4 h-4" />{t('navPlan')}</Link>

        <h1 className="text-2xl font-extrabold mb-6">{t('planSettings')}</h1>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {note && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{note}</span>
          </div>
        )}

        {!status?.package ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center">
            <p className="text-sm text-text-secondary mb-4">{t('noPackageNoPortions')}</p>
            <Link
              to="/packages"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
            >{t('packageBrowse')}</Link>
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-surface p-5 mb-6">
            <h2 className="font-bold text-sm mb-1">
              Portions {pkg && <span className="text-text-secondary">· {L(pkg.name)}</span>}
            </h2>
            <p className="text-xs text-text-secondary mb-4">{t('portionsIntro')}</p>

            {pkg && (
              <>
                <MacroRow
                  label="Protein"
                  spec={pkg.protein}
                  flexible={pkg.flexible}
                  value={protein}
                  onChange={setProtein}
                />
                <MacroRow
                  label="Carbs"
                  spec={pkg.carbs}
                  flexible={pkg.flexible}
                  value={carbs}
                  onChange={setCarbs}
                />

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  {(pkg.slots || []).map((spec) => {
                    const s = slots.find((x) => x.slot === spec.slot);
                    if (!s) return null;
                    return (
                      <div
                        key={spec.slot}
                        className="flex items-center justify-between gap-3"
                      >
                        <span
                          className={`text-sm font-semibold ${
                            s.enabled ? 'text-text' : 'text-text-secondary'
                          }`}
                        >
                          {SLOT_LABELS[spec.slot] || spec.slot}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSlotCount(spec.slot, -1)}
                            disabled={(s.count ?? 0) <= 0}
                            className="w-7 h-7 rounded-lg border border-border disabled:opacity-40 hover:border-primary transition-colors"
                            aria-label={`One less ${spec.slot}`}
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-bold tabular-nums">
                            {s.count ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSlotCount(spec.slot, 1)}
                            disabled={(s.count ?? 0) >= (spec.maxCount ?? 2)}
                            className="w-7 h-7 rounded-lg border border-border disabled:opacity-40 hover:border-primary transition-colors"
                            aria-label={`One more ${spec.slot}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-text-secondary">
                    {preview?.mealsPerDay ?? 0} meals a day
                  </span>
                  <span className="font-extrabold">
                    {kd(preview?.pricePerDay)}
                    <span className="text-xs font-medium text-text-secondary"> /day</span>
                  </span>
                </div>

                {preview?.notes?.length > 0 && (
                  <div className="flex items-start gap-2 p-3 mt-3 rounded-xl bg-warning/10 text-xs">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-warning" />
                    <ul className="space-y-1">
                      {preview.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="flex items-start gap-2 text-xs text-text-secondary mt-4">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />{t('changesApplyNextTerm')}</p>

                <button
                  type="button"
                  onClick={savePortions}
                  disabled={savingPortions}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
                >
                  {savingPortions && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save portions
                </button>
              </>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-bold text-sm mb-1">{t('yourMeasurements')}</h2>
          <p className="text-xs text-text-secondary mb-4">{t('measurementsSetTarget')}</p>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Age"
              value={profile.age}
              onChange={(v) => setProfile((p) => ({ ...p, age: v }))}
            />
            <div>
              <label className="block text-xs font-semibold mb-1.5">{t('gender')}</label>
              <select
                value={profile.gender}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, gender: e.target.value }))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
              >
                <option value="male">{t('genderMale')}</option>
                <option value="female">{t('genderFemale')}</option>
              </select>
            </div>
            <Field
              label="Weight (kg)"
              value={profile.weight}
              onChange={(v) => setProfile((p) => ({ ...p, weight: v }))}
            />
            <Field
              label="Height (cm)"
              value={profile.height}
              onChange={(v) => setProfile((p) => ({ ...p, height: v }))}
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5">{t('activityTitle')}</label>
            <select
              value={profile.activityLevel}
              onChange={(e) =>
                setProfile((p) => ({ ...p, activityLevel: e.target.value }))
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
            >
              {ACTIVITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {t(a.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5">{t('goal')}</label>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, goal: g.value }))}
                  className={`px-2 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                    profile.goal === g.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/40'
                  }`}
                >
                  {t(g.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {calories && (
            <p className="text-center text-sm mt-4">
              Daily target:{' '}
              <span className="font-extrabold text-primary">
                {calories.toLocaleString()} kcal
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors disabled:opacity-60"
          >
            {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Save measurements
          </button>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

function MacroRow({ label, spec, flexible, value, onChange }) {
  const options = spec?.options?.length ? spec.options : [spec?.grams];
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-sm font-extrabold tabular-nums">{value}g</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
              value === g
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-text-secondary hover:border-primary/40'
            }`}
          >
            {g}g
          </button>
        ))}
      </div>
      {flexible && spec?.min != null && spec?.max != null && (
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={5}
          value={value ?? spec.min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary mt-3"
        />
      )}
    </div>
  );
}
