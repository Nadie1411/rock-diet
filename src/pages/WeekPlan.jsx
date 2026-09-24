import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  Pencil,
  Info,
  Clock,
  X,
  Check,
} from 'lucide-react';

import { weekPlanService } from '../services/weekPlanService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { exclusionService } from '../services/exclusionService';
import { en } from '../utils/bilingual';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';
import Countdown from '../components/Countdown';
import { MealInfoSheet, MealSwapSheet } from '../components/MealSheets';

/**
 * "Meals per week" — the subscriber picks a week of meals in advance.
 *
 * Two weeks are shown because the current one is almost always already past
 * its deadline: seeing what is coming without being able to change it is the
 * normal state, and hiding it would make the screen look broken.
 *
 * Edits are held per week until saved, so switching tabs doesn't discard work
 * in progress.
 */

// Keys, not names: this sits at module scope where there is no translator,
// and a literal list here is how the week stayed English on an Arabic page.
// Resolved with t() at render, where the language is known.
// The order a day is eaten in. Matched against the English half of a
// category name, so it holds whichever language is on screen.
const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

const DAY_KEYS = [
  'dayMonday',
  'dayTuesday',
  'dayWednesday',
  'dayThursday',
  'dayFriday',
  'daySaturday',
  'daySunday',
];

const dateOfDay = (weekStart, dayOfWeek) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + (dayOfWeek - 1));
  return d;
};

export default function WeekPlan() {
  const { t, L, lang } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [weeks, setWeeks] = useState([]);
  const [tab, setTab] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [products, setProducts] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [allergyPrompt, setAllergyPrompt] = useState('');
  const [editingDay, setEditingDay] = useState(null);
  // A meal opened for inspection, and optionally swapped from there. Held with
  // its day so a swap knows which one to write back to.
  const [inspecting, setInspecting] = useState(null);
  const [swapping, setSwapping] = useState(null);
  const [restrictions, setRestrictions] = useState({ forbidden: [], disliked: [] });


  const load = useCallback(() => {


    // What the package actually covers. Loaded beside the week rather


    // than inside the picker, so opening a day is instant and the answer


    // is the same for every day.


    weekPlanService


      .getOptions()


      .then((res) => setAllowance(res.data || null))


      .catch(() => setAllowance(null));
    setLoading(true);
    Promise.all([
      weekPlanService.getUpcoming(),
      productService.getAllProducts().catch(() => ({ data: [] })),
      categoryService.getCategories().catch(() => ({ data: [] })),
      exclusionService.getMine().catch(() => ({ data: {} })),
    ])
      .then(([weekRes, prodRes, catRes, exclRes]) => {
        setWeeks(weekRes.data || []);
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
        setRestrictions({
          forbidden: exclRes.data?.forbidden || [],
          disliked: exclRes.data?.disliked || [],
        });
      })
      .catch((err) => setError(err?.message || t('weekLoadError')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const week = weeks[Math.min(tab, Math.max(weeks.length - 1, 0))];
  const weekStart = week?.plan?.weekStart;
  const draft = weekStart ? drafts[weekStart] : null;
  const dirty = Boolean(draft);

  /** Days as `{ [dayOfWeek]: productIds[] }`, draft taking precedence. */
  const days = useMemo(() => {
    const source = draft ?? week?.plan?.days ?? [];
    const map = {};
    for (const d of source) {
      map[d.dayOfWeek] = (d.productIds || []).map((p) =>
        typeof p === 'string' ? p : p._id,
      );
    }
    return map;
  }, [draft, week]);

  const mealsPerDay = week?.plan?.mealsPerDay ?? 3;

  const productById = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p._id, p);
    // A saved plan arrives with its products populated, so a dish still shows
    // even when it has since left the catalogue.
    for (const d of week?.plan?.days ?? []) {
      for (const p of d.productIds || []) {
        if (p && typeof p === 'object') map.set(p._id, p);
      }
    }
    return map;
  }, [products, week]);

  const isComplete = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => i + 1).every(
        (d) => (days[d]?.length ?? 0) >= mealsPerDay,
      ),
    [days, mealsPerDay],
  );

  const setDayMeals = (dayOfWeek, productIds) => {
    if (!weekStart) return;
    const next = { ...days, [dayOfWeek]: productIds };
    setDrafts((prev) => ({
      ...prev,
      [weekStart]: Object.entries(next)
        .filter(([, ids]) => ids.length)
        .map(([d, ids]) => ({ dayOfWeek: Number(d), productIds: ids })),
    }));
  };

  /*
   * `acceptAllergens` is never sent on the first attempt.
   *
   * The server refuses a week containing an allergen and names what it found;
   * that message becomes the confirmation below, and only pressing through it
   * retries with the acknowledgement. So the warning is always shown before
   * the choice, and the choice is always the customer's.
   */
  const save = async (acceptAllergens = false) => {
    if (!weekStart) return;
    setSaving(true);
    setError('');
    setSavedNote('');
    setAllergyPrompt('');
    try {
      await weekPlanService.setWeek({
        weekStart,
        days: drafts[weekStart] || [],
        acceptAllergens,
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[weekStart];
        return next;
      });
      setSavedNote(t('weekPlanSaved'));
      load();
    } catch (err) {
      const msg = err?.message || '';
      // The server names the offending meals in this message; it is the only
      // place that knows, so it is what the customer is asked about.
      if (/allerg/i.test(msg)) {
        setAllergyPrompt(msg.replace(/^[^:]*:\s*/, ''));
      } else {
        setError(msg || t('weekSaveError'));
      }
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!weeks.length) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-extrabold mb-2">{t('yourWeek')}</h1>
          <p className="text-text-secondary text-sm mb-5">
            {error || t('weekChoosingClosedNow')}
          </p>
          <Link
            to="/packages"
            className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
          >{t('packageBrowse')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold mb-4">{t('yourWeek')}</h1>

        {/* Two weeks. A dot marks one still waiting on the customer, since
            the other tab is usually the one that needs them. */}
        {weeks.length > 1 && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface border border-border mb-5">
            {weeks.map((w, i) => {
              const wDays = w.plan?.days ?? [];
              const complete = Array.from({ length: 7 }, (_, n) => n + 1).every(
                (d) =>
                  (wDays.find((x) => x.dayOfWeek === d)?.productIds?.length ??
                    0) >= (w.plan?.mealsPerDay ?? 3),
              );
              const needs = w.canChoose && !complete;
              return (
                <button
                  key={w.plan?.weekStart || i}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                    tab === i
                      ? 'bg-primary text-on-primary'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  {i === 0 ? t('weekThis') : t('weekNext')}
                  {needs && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tab === i ? 'bg-on-primary' : 'bg-primary'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* The refusal, turned into a choice. Shown in place of the error so
            the customer is told exactly what was found and can decide. */}
        {allergyPrompt && (
          <div className="p-4 mb-5 rounded-xl bg-warning/10 border border-warning/30">
            <p className="flex items-start gap-2 font-bold text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
              {t('allergyConfirmTitle')}
            </p>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              {t('allergyConfirmBody', { items: allergyPrompt })}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAllergyPrompt('')}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:border-primary transition-colors disabled:opacity-50"
              >
                {t('allergyConfirmNo')}
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-warning text-white text-xs font-bold disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t('allergyConfirmYes')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {savedNote && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedNote}</span>
          </div>
        )}

        <WeekHeader week={week} />

        <div className="space-y-3 mt-5">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((dayOfWeek) => {
            const ids = days[dayOfWeek] || [];
            const date = weekStart ? dateOfDay(weekStart, dayOfWeek) : null;
            return (
              <div
                key={dayOfWeek}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm">{t(DAY_KEYS[dayOfWeek - 1])}</p>
                    {date && (
                      <p className="text-xs text-text-secondary">
                        {date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        ids.length >= mealsPerDay
                          ? 'text-success'
                          : 'text-text-secondary'
                      }`}
                    >
                      {ids.length}/{mealsPerDay}
                    </span>
                    {week.canChoose && (
                      <button
                        type="button"
                        onClick={() => setEditingDay(dayOfWeek)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:border-primary transition-colors"
                      >
                        <Pencil className="w-3 h-3" />{t('commonEdit')}</button>
                    )}
                  </div>
                </div>

                {ids.length ? (
                  <ul className="space-y-1.5">
                    {ids.map((id) => {
                      const p = productById.get(id);
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => p && setInspecting({ product: p, dayOfWeek })}
                            className="w-full flex items-center gap-2.5 text-sm text-start hover:text-primary transition-colors"
                          >
                          {p?.image?.secure_url && (
                            <img
                              src={p.image.secure_url}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <span className="truncate">
                            {p ? L(p.name) : t('mealsInADay')}
                          </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary">{t('nothingChosen')}</p>
                )}
              </div>
            );
          })}
        </div>

        {week.canChoose && (
          <div className="sticky bottom-4 mt-6">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg">
              {!isComplete && (
                <p className="flex items-start gap-2 text-xs text-text-secondary mb-3">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />{t('weekPlanAutoFill')}</p>
              )}
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving || !dirty}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {dirty ? 'Save my week' : 'Saved'}
              </button>
            </div>
          </div>
        )}
      </div>

      {inspecting && !swapping && (
        <MealInfoSheet
          product={inspecting.product}
          onClose={() => setInspecting(null)}
          onSwap={week?.canChoose ? () => setSwapping(inspecting) : undefined}
        />
      )}

      {swapping && (
        <MealSwapSheet
          product={swapping.product}
          catalogue={products}
          onClose={() => setSwapping(null)}
          onSelect={(replacement) => {
            // Replace in place so the day keeps its order.
            const current = days[swapping.dayOfWeek] || [];
            setDayMeals(
              swapping.dayOfWeek,
              current.map((x) => (x === swapping.product._id ? replacement._id : x)),
            );
            setSwapping(null);
            setInspecting(null);
          }}
        />
      )}

      {editingDay && (
        <DayPicker
          dayOfWeek={editingDay}
          date={weekStart ? dateOfDay(weekStart, editingDay) : null}
          mealsPerDay={mealsPerDay}
          products={products}
          allowance={allowance}
          categories={categories}
          selected={days[editingDay] || []}
          onClose={() => setEditingDay(null)}
          onSave={(ids) => {
            setDayMeals(editingDay, ids);
            setEditingDay(null);
          }}
        />
      )}
    </div>
  );
}

/** Why this week looks the way it does, and whether it can still be changed. */
function WeekHeader({ week }) {
  const { t } = useT();
  const status = week?.plan?.status;

  const config = !week?.canChoose
    ? {
        Icon: Lock,
        tone: 'text-text-secondary',
        bg: 'bg-surface',
        title: t('weekChoosingClosed'),
        body: t('weekKitchenCooking'),
      }
    : status === 'auto'
      ? {
          Icon: Sparkles,
          tone: 'text-primary',
          bg: 'bg-primary/5',
          title: t('weekAutoFilled'),
          body: t('weekAutoFilledBody'),
        }
      : status === 'chosen'
        ? {
            Icon: CheckCircle2,
            tone: 'text-success',
            bg: 'bg-success/10',
            title: t('weekChosen'),
            body: '',
          }
        : {
            Icon: Clock,
            tone: 'text-warning',
            bg: 'bg-warning/10',
            title: t('weekPickMeals'),
            body: '',
          };

  const { Icon } = config;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border border-border ${config.bg}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.tone}`} />
      <div>
        <p className="font-bold text-sm">{config.title}</p>
        {week?.canChoose && (
          <Countdown deadline={week.deadline} className="text-xs mt-0.5" />
        )}
        {config.body && (
          <p className="text-xs text-text-secondary mt-0.5">{config.body}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Choosing one day's meals.
 *
 * Grouped under their slot rather than filtered to one at a time — a day is
 * several slots at once, and making someone switch filters to see the shape
 * of it hides the thing they are deciding.
 */
function DayPicker({
  dayOfWeek,
  date,
  mealsPerDay,
  products,
  allowance,
  categories,
  selected,
  onClose,
  onSave,
}) {
  const { t, L, lang } = useT();
  const [picked, setPicked] = useState(selected);

  /**
   * Which course is on screen. Empty means the first one.
   *
   * The sheet used to stack every course in one scroll, so editing Sunday's
   * dinner meant scrolling past breakfast and lunch to reach it, and nothing
   * on screen said how many of each the day was allowed.
   */
  const [courseFilter, setCourseFilter] = useState('');

  const full = picked.length >= mealsPerDay;

  // The slot a category stands for, matched on the English half so it holds
  // in Arabic. `null` when the kitchen has added a category outside the four
  // the day is built from.
  const slotOfCategory = useCallback(
    (catId) => {
      const cat = categories.find((c) => c._id === catId);
      const name = en(cat?.name).toLowerCase();
      return SLOT_ORDER.find((slot) => name.includes(slot)) ?? null;
    },
    [categories],
  );

  const grouped = useMemo(() => {
    const byCategory = new Map();
    for (const p of products) {
      const catId =
        typeof p.categoryId === 'string' ? p.categoryId : p.categoryId?._id;

      // Only what the package pays for, at the size this slot is worth.
      //
      // The whole catalogue used to be offered, so a customer could build a
      // day their package does not cover and the kitchen would not cook —
      // and they would only find out when the box arrived wrong. The server
      // decides this; if it could not answer, nothing is filtered rather
      // than a guess being made about what is allowed.
      if (allowance?.hasPackage) {
        const slot = slotOfCategory(catId);
        const permitted = slot ? allowance.options?.[slot] : null;
        if (!permitted) continue;
        if (!permitted.includes(String(p._id))) continue;
      }

      if (!byCategory.has(catId)) byCategory.set(catId, []);
      byCategory.get(catId).push(p);
    }

    // A day is read in the order it is eaten, not the order the kitchen
    // happened to create the categories in. Ranked on the English half of the
    // name so the sequence holds in Arabic too; anything the kitchen adds
    // later sorts after these rather than landing in the middle of them.
    const rank = (catId) => {
      const cat = categories.find((c) => c._id === catId);
      const name = en(cat?.name).toLowerCase();
      const i = SLOT_ORDER.findIndex((slot) => name.includes(slot));
      return i === -1 ? SLOT_ORDER.length : i;
    };

    return [...byCategory.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [products, categories, allowance, slotOfCategory]);

  /** How many of each course this package buys a day. */
  const slotCounts = useMemo(() => {
    const counts = {};
    for (const s of allowance?.slots ?? []) {
      if (s.count > 0) counts[s.slot] = s.count;
    }
    return counts;
  }, [allowance]);

  /** The dishes of one course, and how many of them this day may hold. */
  const courseOf = useCallback(
    (catId) => {
      const slot = slotOfCategory(catId);
      return { slot, allowance: slot ? (slotCounts[slot] ?? 0) : 0 };
    },
    [slotOfCategory, slotCounts],
  );

  /**
   * Chosen so far in the course a dish belongs to.
   *
   * Counted over the products on offer rather than the ids alone, because an
   * id says nothing about which course it came from.
   */
  const chosenInCourse = useCallback(
    (slot) =>
      picked.filter((id) => {
        const product = products.find((p) => p._id === id);
        if (!product) return false;
        const catId =
          typeof product.categoryId === 'string'
            ? product.categoryId
            : product.categoryId?._id;
        return slotOfCategory(catId) === slot;
      }).length,
    [picked, products, slotOfCategory],
  );

  /** The courses this day is built from, in the order it is eaten. */
  const courses = useMemo(
    () =>
      grouped.map(([catId]) => {
        const slot = slotOfCategory(catId);
        const cat = categories.find((c) => c._id === catId);
        return {
          catId,
          slot,
          label: cat ? L(cat.name) : t('commonOther'),
          allowance: slot ? (slotCounts[slot] ?? 0) : 0,
          taken: slot ? chosenInCourse(slot) : 0,
        };
      }),
    [grouped, categories, slotOfCategory, slotCounts, chosenInCourse, L, t],
  );

  /** The course on screen: the one chosen, else the first. */
  const activeCourse = useMemo(() => {
    const match = courses.find(
      (c) => c.slot === courseFilter || c.catId === courseFilter,
    );
    return (match ?? courses[0])?.catId ?? null;
  }, [courses, courseFilter]);

  const toggle = (id, catId) => {
    const { slot, allowance: courseAllowance } = courseOf(catId);
    const removing = picked.includes(id);
    const takenBefore = slot ? chosenInCourse(slot) : 0;
    const wasFull = Boolean(slot) && courseAllowance > 0 && takenBefore >= courseAllowance;

    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);

      // A course that is full swaps rather than refuses: the dish chosen
      // first makes way, in its place. Four meals a day means one breakfast,
      // one lunch, one dinner and a snack — not four breakfasts, which is
      // what a bare daily total allowed, and what the kitchen would then
      // have had to cook.
      if (slot && courseAllowance > 0) {
        const inCourse = prev.filter((x) => {
          const product = products.find((p) => p._id === x);
          const otherCat =
            typeof product?.categoryId === 'string'
              ? product.categoryId
              : product?.categoryId?._id;
          return slotOfCategory(otherCat) === slot;
        });
        if (inCourse.length >= courseAllowance) {
          return prev.map((x) => (x === inCourse[0] ? id : x));
        }
      } else if (prev.length >= mealsPerDay) {
        // No course of its own to swap within, so the day's total decides.
        return prev;
      }

      return [...prev, id];
    });

    // Finishing a course moves on to the next one still short, the same way
    // the subscribe wizard walks a day.
    //
    // Not when un-choosing, and not on a swap: both mean someone came back to
    // a course on purpose, and moving them off it is the opposite of help.
    if (removing || wasFull) return;

    if (slot && courseAllowance > 0 && takenBefore + 1 >= courseAllowance) {
      const order = grouped.map(([cat]) => slotOfCategory(cat));
      const from = order.indexOf(slot);
      const next = grouped
        .slice(from + 1)
        .find(([cat]) => {
          const nextSlot = slotOfCategory(cat);
          const room = nextSlot ? (slotCounts[nextSlot] ?? 0) : 0;
          return room > 0 && chosenInCourse(nextSlot) < room;
        });
      if (next) setCourseFilter(slotOfCategory(next[0]));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] bg-bg rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 p-4 border-b border-border bg-surface">
          <div>
            <h2 className="font-extrabold">{t(DAY_KEYS[dayOfWeek - 1])}</h2>
            {date && (
              <p className="text-xs text-text-secondary">
                {date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold tabular-nums ${
                full ? 'text-success' : 'text-text-secondary'
              }`}
            >
              {picked.length}/{mealsPerDay}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg"
              aria-label={t('commonClose')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* One course at a time, each chip saying how much of it is decided.
            The same shape as the subscribe wizard, because it is the same
            decision being made a second time. */}
        {courses.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-1 bg-surface border-b border-border">
            {courses.map((course) => {
              const on = course.catId === activeCourse;
              const done = course.allowance > 0 && course.taken >= course.allowance;
              return (
                <button
                  key={course.catId || 'other'}
                  type="button"
                  onClick={() => setCourseFilter(course.slot || course.catId)}
                  aria-pressed={on}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                    on
                      ? 'bg-text text-surface border-text'
                      : done
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-surface border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  {course.label}
                  {course.allowance > 0 && (
                    <span className="tabular-nums opacity-80">
                      {course.taken}/{course.allowance}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {grouped
            .filter(([catId]) => catId === activeCourse)
            .map(([catId, items]) => {
            const cat = categories.find((c) => c._id === catId);
            // A course with an allowance of its own is never closed: picking
            // a second breakfast swaps the first out. Only a dish with no
            // course to swap within is blocked by a full day.
            const courseHasRoom = courseOf(catId).allowance > 0;
            return (
              <section key={catId || 'other'}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">
                  {cat ? L(cat.name) : t('commonOther')}
                </h3>
                {/* Says what this slot is worth, so a short list reads as the
                    package doing its job rather than the menu being broken. */}
                {(() => {
                  const slot = slotOfCategory(catId);
                  const budget = slot ? allowance?.budgets?.[slot] : null;
                  if (!budget) return null;
                  return (
                    <p className="text-[11px] text-text-secondary mb-2">
                      {t('slotTarget', {
                        protein: Math.round(budget.protein),
                        carbs: Math.round(budget.carbs),
                      })}
                    </p>
                  );
                })()}
                <div className="space-y-2">
                  {items.map((p) => {
                    const chosen = picked.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggle(p._id, catId)}
                        disabled={!chosen && full && !courseHasRoom}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                          chosen
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-surface hover:border-primary/40'
                        } ${!chosen && full ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {p.image?.secure_url && (
                          <img
                            src={p.image.secure_url}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold truncate">
                            {L(p.name)}
                          </span>
                        </span>
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                            chosen ? 'bg-primary border-primary' : 'border-border'
                          }`}
                        >
                          {chosen && (
                            <Check
                              className="w-3 h-3 text-on-primary"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="p-4 border-t border-border bg-surface">
          <button
            type="button"
            onClick={() => onSave(picked)}
            className="w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
          >{t('commonDone')}</button>
        </footer>
      </div>
    </div>
  );
}
