import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Loader2,
  Flame,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  Minus,
  Plus,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';

import { packageService } from '../services/packageService';
import { settingsService } from '../services/settingsService';
import { subscriptionService } from '../services/subscriptionService';
import { couponService } from '../services/couponService';
import PromoCodes from '../components/PromoCodes';
import { caloriesOf } from '../components/MealSheets';
import { endChangePlan } from '../utils/changePlanIntent';
import { readDraft, writeDraft, clearDraft } from '../utils/subscribeDraft';
import { exclusionService } from '../services/exclusionService';
import { conflictsFor, expandExclusions, labelList } from '../utils/allergens';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { targetCalories, DEFAULT_CALORIE_CONFIG } from '../utils/calories';
import PackageCard, { approximateDailyCalories } from '../components/PackageCard';
import { useT } from '../i18n/useT';
import { useAuthGate } from '../context/AuthGate';

/**
 * The subscription builder: package → about you → target → duration → meals →
 * review. Six steps, the same six the mobile app walks through, because
 * configuring a package and choosing what goes in it are one decision to the
 * person making it.
 *
 * The server prices everything. Portions are snapped to what the package
 * offers, the day is held inside its meal band and the term is discounted by
 * POST /package/:slug/selection and POST /user/subscription/quote — this
 * screen shows what they return rather than adding anything up itself, so the
 * figure quoted is the figure charged.
 */

const STEPS = ['Package', 'About you', 'Target', 'Duration', 'Allergies', 'Meals', 'Review'];

/**
 * Steps by name. Allergies sit before the meals on purpose: a dish the
 * customer cannot eat should be greyed out while they choose, not refused
 * after they have paid — and the step is skippable in one tap for the many
 * who have none.
 */
const STEP = {
  PACKAGE: 0,
  ABOUT: 1,
  TARGET: 2,
  DURATION: 3,
  ALLERGIES: 4,
  MEALS: 5,
  REVIEW: 6,
};

/** The steps as the address bar names them: `/subscribe?step=meals`. */
const STEP_SLUGS = ['package', 'about', 'target', 'duration', 'allergies', 'meals', 'review'];

/**
 * Whether a category is the one for this course.
 *
 * Matched on the English half of `"Breakfast || فطور"` rather than on the
 * translated name. Matching the displayed name meant the whole grouping
 * silently failed in Arabic — "فطور" does not start with "breakfast" — and
 * every dish fell through to "everything else".
 */
const matchesSlot = (name, slot) => {
  const english = String(name ?? '').split('||')[0].trim().toLowerCase();
  return english.startsWith(slot);
};

/** The order a day is eaten in, which is the order the picker offers. */
const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Monday first, matching `dayOfWeek` 1–7 as the week plan counts them. */
const DAY_KEYS = [
  'dayMonday',
  'dayTuesday',
  'dayWednesday',
  'dayThursday',
  'dayFriday',
  'daySaturday',
  'daySunday',
];


/** Months as the API spells them, with what a longer commitment saves. */
/**
 * `label` is the value the API expects ("1 month"), not display text — it is
 * sent as `duration` and compared against. `labelKey` is what the customer
 * reads, which is why the two are separate rather than one translated string.
 */
const DURATIONS = [
  { months: 1, label: '1 month', labelKey: 'duration1Month', discount: 0 },
  { months: 3, label: '3 months', labelKey: 'duration3Months', discount: 10 },
  { months: 6, label: '6 months', labelKey: 'duration6Months', discount: 15 },
  { months: 12, label: '12 months', labelKey: 'duration12Months', discount: 20 },
];

/** Keys, not words: these labels appear in both languages. */
const SLOT_LABELS = {
  breakfast: 'slotBreakfast',
  lunch: 'slotLunch',
  dinner: 'slotDinner',
  snack: 'slotSnack',
};

const GOALS = [
  { value: 'weight_loss', labelKey: 'planGoalWeightLoss' },
  { value: 'maintenance', labelKey: 'calorieMaintenance' },
  { value: 'bulking', labelKey: 'muscleGain' },
];

const ACTIVITY = [
  { value: 'sedentary', labelKey: 'activitySedentary' },
  { value: 'light', labelKey: 'activityLight' },
  { value: 'moderate', labelKey: 'activityModerate' },
  { value: 'active', labelKey: 'activityActive' },
  { value: 'very_active', labelKey: 'activityVeryActive' },
];

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

export default function Subscribe() {
  const { t, L, lang } = useT();
  const { requireAuth } = useAuthGate();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  /**
   * Where the wizard is open — which step and, on the meals step, which
   * day — read from the address rather than held here:
   * `/subscribe?step=meals&day=3`.
   *
   * Every move forward is a history entry, so the browser's Back button
   * retraces the wizard the way the one in the footer does. While the steps
   * were state, both buttons said Back and only one of them meant it: the
   * browser's left the page, and six steps of choices with it. It also means
   * a reload opens the same step, and the same day of the week.
   */
  const step = Math.max(0, STEP_SLUGS.indexOf(searchParams.get('step')));
  const activeDay = Math.min(Math.max(Number(searchParams.get('day')) || 1, 1), 7);

  /**
   * Opens a position. Pushed, so Back returns here — except when replacing
   * the entry the customer arrived on, which the draft restore does.
   *
   * The entry records the position it was opened from. That is how the
   * footer's Back knows whether the entry behind this one belongs to the
   * wizard, and can retrace it instead of opening a new one; nothing is
   * known about what is behind a replaced entry.
   *
   * Only the step and the day travel: `?package=` from the packages page is
   * dropped on the first move, since it re-chooses that package on every
   * reload and would have undone a change of mind.
   */
  const goTo = useCallback(
    ({ step: nextStep, day = 1 }, { replace = false } = {}) => {
      const params = new URLSearchParams();
      if (nextStep > STEP.PACKAGE) params.set('step', STEP_SLUGS[nextStep]);
      if (nextStep === STEP.MEALS && day > 1) params.set('day', String(day));
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace, state: { from: replace ? null : { step, day: activeDay } } },
      );
    },
    [navigate, location.pathname, step, activeDay],
  );

  /**
   * The footer's Back: one position back — the day before on the meals
   * step, the step before elsewhere.
   *
   * When that is exactly what sits behind this entry, which it is whenever
   * the customer got here with Continue, the history is retraced — the very
   * move the browser's own button makes, so the two never disagree and the
   * browser's Back never lands on a step the footer's just left. When it is
   * not — a position reached from a restored draft, a link, or a jump along
   * the row of days — the previous one is opened afresh.
   */
  const goBack = () => {
    const from = location.state?.from;
    const behindIsPrevious =
      from &&
      (from.step === step - 1 ||
        (from.step === step && step === STEP.MEALS && from.day === activeDay - 1));
    if (behindIsPrevious) {
      navigate(-1);
      return;
    }
    if (step === STEP.MEALS && activeDay > 1) goTo({ step, day: activeDay - 1 });
    else goTo({ step: step - 1, day: step - 1 === STEP.MEALS ? DAY_KEYS.length : 1 });
  };

  // Each step is its own screen, but the whole wizard is one route, and the
  // router only scrolls to the top when the path changes. Without this a
  // customer who scrolled down a long step to reach Continue — the package
  // list is the usual one — opened the next step that far down, at the
  // buttons rather than its heading. Back is covered by the same effect, and
  // so is the next day of the week, whose menu starts at the top again.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, activeDay]);

  const [packages, setPackages] = useState([]);
  const [calorieConfig, setCalorieConfig] = useState(DEFAULT_CALORIE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // What the customer is building.
  const [pkg, setPkg] = useState(null);

  // A promo code on a subscription, which simply had nowhere to be entered:
  // the basket took codes and the term did not, so the larger purchase was
  // the one that could not be discounted.
  //
  // Previewed against the quote through the same endpoint the basket uses.
  // The server re-checks it at checkout and prices from its own answer — this
  // is what the customer is shown, never what they are charged on.
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  // The allergy the customer has been warned about but not yet answered.
  //
  // Holds the server's own sentence, which is the only place the offending
  // dishes are named. Empty until the first attempt is refused.
  const [allergyPrompt, setAllergyPrompt] = useState('');

  // Whether the whole shelf of packages is on show.
  //
  // Once a package is chosen the rest are just distance between the choice
  // and the settings that follow it — protein, carbs, meals a day — which sat
  // below four cards nobody was going to read again. Choosing collapses the
  // list to the one picked; this reopens it.
  const [browsingPackages, setBrowsingPackages] = useState(false);

  /**
   * Keeps the chosen package under the eye when the list collapses.
   *
   * Choosing removes the other cards — around 730px on a phone — from above
   * the settings. The scroll position does not move, so the page does not
   * scroll, but everything the customer was looking at slides up past the top
   * of the screen and they are left staring at the protein slider. It reads
   * exactly like the page jumping down on its own.
   *
   * So the view is put back on the card they picked, with the settings
   * starting just underneath it. Only when the list collapses: reopening it
   * to browse leaves the page where it is.
   */
  const anchorRef = useRef(null);

  /** Where the card sat on screen a moment before the list changed. */
  const holdCardStill = useCallback((slug) => {
    const card = document.querySelector(`[data-pkg="${slug}"]`);
    anchorRef.current = card
      ? { slug, top: card.getBoundingClientRect().top }
      : null;
  }, []);
  const [protein, setProtein] = useState(null);
  const [carbs, setCarbs] = useState(null);
  const [slots, setSlots] = useState([]);
  const [duration, setDuration] = useState('1 month');
  const [goal, setGoal] = useState('maintenance');
  const [profile, setProfile] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderate',
  });
  const [manualCalories, setManualCalories] = useState(null);
  /**
   * The first week's dishes: `dayMeals[dayOfWeek] = [productId, …]`.
   *
   * One week, walked a day at a time — Monday, then Tuesday, on to Sunday.
   * Someone buying a month used to be asked about one Monday and nothing
   * else; the rest of the term is still filled by the sweep and can be
   * changed a week at a time from My Plan, which is where planning further
   * ahead belongs. Every day here stays optional.
   */
  const [categories, setCategories] = useState([]);
  const [dayMeals, setDayMeals] = useState({});

  /**
   * What the kitchen must keep out, as ingredient or group ids.
   *
   * Asked before the meals, so the unsafe ones are greyed out while
   * choosing. A guest's answer lives in the draft until they sign in to pay,
   * when it is merged into their account's list; a signed-in customer sees
   * their existing list here and whatever they leave ticked is saved as-is.
   */
  const [allergies, setAllergies] = useState([]);
  const [allergyCatalog, setAllergyCatalog] = useState([]);
  // The account's lists as last read from the server, or null for a guest.
  const [serverExclusions, setServerExclusions] = useState(null);
  // 'exact' once a signed-in customer has seen the step (their ticks are
  // the whole list); 'merge' for a guest's ticks, which join the account's.
  const [allergyMode, setAllergyMode] = useState('merge');
  const [allergySaving, setAllergySaving] = useState(false);
  /**
   * Which course the meals step is showing.
   *
   * One course at a time, always. The whole day at once was a menu of forty
   * dishes with the four decisions inside it left for the customer to find —
   * and "1 of 4 meals" said nothing about which four. Empty means "the first
   * course this package buys", resolved below once the package is known.
   */
  const [slotFilter, setSlotFilter] = useState('');

  // Every day opens at breakfast and is walked through in the order it is
  // eaten. A course carried over from the previous day would open Tuesday on
  // whatever Monday finished on, which is the middle of a decision.
  useEffect(() => {
    setSlotFilter('');
  }, [activeDay]);

  // Monday, for the pieces that only ever spoke about a day: the saved draft
  // and the line on the review screen.
  const firstDayProductIds = useMemo(() => dayMeals[1] || [], [dayMeals]);

  const dayIds = useCallback((day) => dayMeals[day] || [], [dayMeals]);

  /**
   * Keeps what they have configured while they go and register.
   *
   * Signing up is asked for at the pay button, which means leaving this page
   * with five steps of choices behind them — package, macros, meals per day,
   * the first day's dishes. Coming back to an empty wizard would make the
   * deferred signup worse than asking up front, so the draft is held for the
   * tab and restored on return.
   *
   * Session-scoped: a draft is worth keeping across a round trip to the
   * signup form, not across days.
   */

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const d = readDraft();
    if (!d) return;

    if (d.duration) setDuration(d.duration);
    if (d.protein != null) setProtein(d.protein);
    if (d.carbs != null) setCarbs(d.carbs);
    if (Array.isArray(d.slots) && d.slots.length) setSlots(d.slots);
    if (d.dayMeals && typeof d.dayMeals === 'object') setDayMeals(d.dayMeals);
    else if (d.weeks?.[1]) setDayMeals(d.weeks[1]);
    else if (Array.isArray(d.firstDayProductIds)) {
      // A draft written before the wizard could offer more than one day.
      setDayMeals({ 1: d.firstDayProductIds });
    }
    if (Array.isArray(d.allergies)) setAllergies(d.allergies.map(String));
    if (d.profile) setProfile((prev) => ({ ...prev, ...d.profile }));
    if (d.goal) setGoal(d.goal);
    if (d.slug) setPendingSlug(d.slug);

    // The step too, unless the address already names one — a reload does —
    // or names a package, which is the packages page sending someone to
    // start again with that one chosen.
    if (
      typeof d.step === 'number' &&
      !searchParams.get('step') &&
      !searchParams.get('package')
    ) {
      goTo(
        { step: Math.min(Math.max(d.step, 0), STEPS.length - 1) },
        { replace: true },
      );
    }
    // Runs once, on arrival: what the address said then is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The package object arrives with the list, so the slug is remembered and
  // matched up once it does.
  const [pendingSlug, setPendingSlug] = useState(null);
  useEffect(() => {
    if (!pendingSlug || pkg || !packages.length) return;
    const found = packages.find((x) => x.slug === pendingSlug);
    if (found) setPkg(found);
    setPendingSlug(null);
  }, [pendingSlug, pkg, packages]);

  // A later step reached by address alone — a bookmark, a shared link, a
  // draft whose package has since been withdrawn — has nothing to show
  // without a package. Start at the beginning.
  useEffect(() => {
    if (loading || pkg || step === STEP.PACKAGE) return;
    if (pendingSlug && packages.some((x) => x.slug === pendingSlug)) return;
    goTo({ step: STEP.PACKAGE }, { replace: true });
  }, [loading, pkg, step, pendingSlug, packages, goTo]);

  useEffect(() => {
    if (!pkg) return;
    // `profile` and `goal` travel with it: the signup form asks for the same
    // age, weight, height, gender and goal the wizard just collected, and
    // asking twice in one sitting is how a purchase gets abandoned.
    writeDraft({
      slug: pkg.slug,
      duration,
      protein,
      carbs,
      slots,
      dayMeals,
      step,
      profile,
      goal,
      allergies,
    });
  }, [pkg, duration, protein, carbs, slots, dayMeals, step, profile, goal, allergies]);

  // The allergen catalogue is public and shared; the account's own lists are
  // read once signed in, and prefill the step so nobody re-ticks what they
  // told us last month.
  useEffect(() => {
    exclusionService
      .getCatalog()
      .then((res) => setAllergyCatalog(res.data || []))
      .catch(() => setAllergyCatalog([]));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setServerExclusions(null);
      return;
    }
    exclusionService
      .getMine()
      .then((res) => {
        const mine = {
          forbidden: (res.data?.forbidden || []).map(String),
          disliked: (res.data?.disliked || []).map(String),
          notes: res.data?.notes || '',
        };
        setServerExclusions(mine);
        // Their list is the starting point unless they already ticked
        // something as a guest, which is kept and merged on save.
        setAllergies((current) =>
          current.length ? current : mine.forbidden,
        );
      })
      .catch(() => setServerExclusions({ forbidden: [], disliked: [], notes: '' }));
  }, [isAuthenticated]);

  /**
   * Writes the ticked allergies to the account.
   *
   * Exact for a signed-in customer who has seen the step: what is ticked is
   * their list. Merged for a guest's ticks arriving at sign-in: nothing on
   * the account is un-ticked by a form they filled in before they had one.
   * Dislikes and notes are carried across untouched.
   */
  const saveAllergies = useCallback(async (list = allergies, mode = allergyMode) => {
    if (!isAuthenticated) return;
    let mine = serverExclusions;
    if (!mine) {
      const res = await exclusionService.getMine();
      mine = {
        forbidden: (res.data?.forbidden || []).map(String),
        disliked: (res.data?.disliked || []).map(String),
        notes: res.data?.notes || '',
      };
    }
    const forbidden =
      mode === 'exact'
        ? [...new Set(list)]
        : [...new Set([...mine.forbidden, ...list])];
    const same =
      forbidden.length === mine.forbidden.length &&
      forbidden.every((id) => mine.forbidden.includes(id));
    if (same) return;
    await exclusionService.setMine({
      forbidden,
      // A group ticked as an allergy cannot also be a dislike.
      disliked: mine.disliked.filter((id) => !forbidden.includes(id)),
      notes: mine.notes,
    });
    setServerExclusions({ ...mine, forbidden });
  }, [isAuthenticated, serverExclusions, allergyMode, allergies]);

  const toggleAllergy = (id) => {
    if (isAuthenticated) setAllergyMode('exact');
    setAllergies((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };

  /** Leaves the allergies step. Saves first when there is an account to save to. */
  const leaveAllergies = async ({ skip = false } = {}) => {
    setError('');
    const list = skip ? [] : allergies;
    const mode = skip && isAuthenticated ? 'exact' : allergyMode;
    if (skip) {
      setAllergies([]);
      if (isAuthenticated) setAllergyMode('exact');
    }
    if (isAuthenticated) {
      setAllergySaving(true);
      try {
        await saveAllergies(list, mode);
      } catch (err) {
        setError(err?.message || t('restrictionsSaveFailed'));
        setAllergySaving(false);
        return;
      }
      setAllergySaving(false);
    }
    goTo({ step: STEP.MEALS });
  };

  // What the server says about it.
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState([]);

  /** Every ingredient id the ticked allergies cover, groups expanded. */
  const excludedSet = useMemo(
    () => expandExclusions(allergies, allergyCatalog),
    [allergies, allergyCatalog],
  );

  /**
   * A dish that contains something ticked. The server refuses it at
   * checkout regardless; greying it out here is so the refusal never comes
   * after the money.
   */
  const unsafeHits = useCallback(
    (product) => conflictsFor(product, excludedSet).hits,
    [excludedSet],
  );

  // Drop any dish already chosen that a newly ticked allergy rules out.
  useEffect(() => {
    if (!excludedSet.size || !products.length) return;
    const byId = new Map(products.map((p) => [p._id, p]));
    setDayMeals((current) => {
      let changed = false;
      const next = {};
      for (const [day, ids] of Object.entries(current)) {
        const kept = (ids || []).filter((id) => {
          const product = byId.get(id);
          return !product || !conflictsFor(product, excludedSet).hits.length;
        });
        if (kept.length !== (ids || []).length) changed = true;
        next[day] = kept;
      }
      return changed ? next : current;
    });
  }, [excludedSet, products]);


  // Signing in is required to buy. Sent to login rather than allowed to build
  // a plan that cannot be paid for at the end.

  // Seed the wizard from the account. A subscriber has already answered most
  // of this at signup, and asking again reads as though the first answer went
  // nowhere.
  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      age: user.age ?? p.age,
      weight: user.weight ?? p.weight,
      height: user.height ?? p.height,
      gender: user.gender ?? p.gender,
      activityLevel: user.activityLevel ?? p.activityLevel,
    }));
    if (user.goal) setGoal(user.goal);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      packageService.getPackages(),
      settingsService.getPublicSettings().catch(() => null),
    ])
      .then(([pkgRes, settingsRes]) => {
        if (!mounted) return;
        // A trial box is a single day someone tries without subscribing; it
        // carries no durations, so it cannot be bought as a term here.
        const list = (pkgRes.data || []).filter(
          (p) => !p.trial && (p.durations?.length ?? 0) > 0,
        );
        setPackages(list);
        const cfg = settingsRes?.data?.calories;
        if (cfg) setCalorieConfig(cfg);

        const wanted = searchParams.get('package');
        const initial = wanted ? list.find((p) => p.slug === wanted) : null;
        if (initial) choosePackage(initial);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Adopt a package and start from its own defaults. */
  const choosePackage = useCallback((next) => {
    setPkg(next);
    setBrowsingPackages(false);
    setProtein(next.protein?.grams ?? null);
    setCarbs(next.carbs?.grams ?? null);
    setSlots(
      (next.slots || []).map((s) => ({
        slot: s.slot,
        enabled: s.enabled !== false,
        count: s.defaultCount ?? 1,
      })),
    );
    const months = next.durations?.[0] ?? 1;
    setDuration(DURATIONS.find((d) => d.months === months)?.label ?? '1 month');
    setQuote(null);
  }, []);

  /**
   * Holds the tapped card still while the list grows or shrinks around it.
   *
   * Collapsing removes about 730px of cards from above the settings. The
   * scroll position does not move, so the page never "scrolls" — but
   * everything the customer was looking at slides up past the top of the
   * screen and they are left on the protein slider. Correcting it afterwards
   * with a scroll only replaces one lurch with another.
   *
   * So the card's position on screen is measured before the change and again
   * straight after, and the difference is taken out of the scroll offset in
   * the same breath. In `useLayoutEffect`, which runs after the DOM is
   * updated and before the browser paints, so the adjustment is never seen:
   * the cards around it appear or vanish and the chosen one does not budge.
   */
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchorRef.current = null;

    const card = document.querySelector(`[data-pkg="${anchor.slug}"]`);
    if (!card) return;

    const delta = card.getBoundingClientRect().top - anchor.top;
    if (!delta) return;

    // `behavior: 'instant'` on purpose. `html { scroll-behavior: smooth }`
    // makes every programmatic scroll animate, so this correction would be
    // seen gliding down the page — which is the very thing it exists to
    // prevent. It has to land before the next paint, not travel there.
    window.scrollBy({ top: delta, behavior: 'instant' });
  }, [pkg, browsingPackages]);

  const selection = useMemo(
    () => ({
      protein,
      carbs,
      slots: slots.map(({ slot, enabled, count }) => ({ slot, enabled, count })),
    }),
    [protein, carbs, slots],
  );

  // Ask the server what this selection actually is. It snaps portions to the
  // package's options, drops disabled slots and holds the day inside the meal
  // band — and says so in `notes`, which is what the customer reads.
  const previewSeq = useRef(0);
  useEffect(() => {
    if (!pkg || protein == null || carbs == null) return;
    const seq = ++previewSeq.current;
    setPreviewing(true);

    const timer = setTimeout(() => {
      packageService
        .previewSelection(pkg.slug, selection)
        .then((res) => {
          // Ignore a reply that a newer edit has already superseded.
          if (seq !== previewSeq.current) return;
          setPreview(res.data || null);
        })
        .catch(() => {
          if (seq === previewSeq.current) setPreview(null);
        })
        .finally(() => {
          if (seq === previewSeq.current) setPreviewing(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [pkg, selection, protein, carbs]);

  const calculatedCalories = useMemo(
    () => targetCalories(profile, goal, calorieConfig),
    [profile, goal, calorieConfig],
  );
  const calories = manualCalories ?? calculatedCalories;

  const recommendedSlug = useMemo(() => {
    if (!calculatedCalories || !packages.length) return null;
    return packages.reduce((best, p) =>
      Math.abs(approximateDailyCalories(p) - calculatedCalories) <
      Math.abs(approximateDailyCalories(best) - calculatedCalories)
        ? p
        : best,
    ).slug;
  }, [packages, calculatedCalories]);

  // The meals step offers what the package covers. An empty `products` on the
  // package means the whole menu, which is what every package has today.
  //
  // Categories come with it: they are what sorts the menu into breakfast,
  // lunch, dinner and snack, and without them the step is one long grid.
  useEffect(() => {
    if (step !== STEP.MEALS || products.length) return;
    productService
      .getAllProducts()
      .then((res) => setProducts(res.data || []))
      .catch(() => {});
    categoryService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, [step, products.length]);

  const offeredProducts = useMemo(() => {
    const allowed = pkg?.products || [];
    if (!allowed.length) return products;
    const ids = new Set(allowed.map((p) => (typeof p === 'string' ? p : p._id)));
    return products.filter((p) => ids.has(p._id));
  }, [products, pkg]);

  // Price the term on the review step, from the server.
  useEffect(() => {
    if (step !== STEP.REVIEW || !pkg) return;
    setQuoting(true);
    setError('');
    subscriptionService
      .quote({ slug: pkg.slug, duration, selection })
      .then((res) => setQuote(res.data || null))
      .catch((err) => {
        // A visitor cannot be quoted by a server that still wants a token.
        // Showing them "token not exist" explains nothing and reads as
        // breakage; they simply have not signed in yet, which the pay button
        // is about to handle.
        if (!isAuthenticated && err?.status === 401) {
          setError('');
          return;
        }
        setError(err?.message || t('couldNotPrice'));
      })
      .finally(() => setQuoting(false));
  }, [step, pkg, duration, selection]);

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

  const toggleSlot = (slotName) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.slot !== slotName) return s;
        const spec = pkg?.slots?.find((x) => x.slot === slotName);
        const enabled = !s.enabled;
        return {
          ...s,
          enabled,
          count: enabled ? Math.max(s.count || 1, 1) : 0,
          ...(enabled && !s.count ? { count: spec?.defaultCount ?? 1 } : {}),
        };
      }),
    );
  };

  /**
   * How many dishes the first day may hold.
   *
   * The same number the customer set on step one, and until now the meal
   * picker ignored it entirely — you could choose four meals a day and then
   * tick nine dishes, which priced one thing and cooked another.
   *
   * Taken from the priced preview where there is one, because that is the
   * figure the server agreed to; the local slots are the fallback while the
   * price is still being fetched.
   */
  const mealLimit = useMemo(() => {
    const priced = preview?.mealsPerDay ?? quote?.mealsPerDay;
    if (priced) return priced;
    return slots.reduce((n, s) => n + (s.enabled ? s.count || 0 : 0), 0);
  }, [preview, quote, slots]);

  const activeIds = dayIds(activeDay);

  /**
   * Whether the footer should offer the next day rather than the review.
   *
   * The way to Tuesday used to sit under the whole of Monday's menu, a long
   * scroll below the pinned bar that already held a Continue — so the bar's
   * button walks the week instead, and only reads Continue once there is no
   * day left to fill: on the last day, or sooner when every day already
   * holds all the dishes the package allows and someone has just come back
   * to change one. Days stay optional; nobody is made to fill Sunday.
   */
  const weekDone = useMemo(
    () => mealLimit > 0 && DAY_KEYS.every((_, i) => dayIds(i + 1).length >= mealLimit),
    [mealLimit, dayIds],
  );
  const moreDays = step === STEP.MEALS && activeDay < DAY_KEYS.length && !weekDone;

  /**
   * How many of each course this package buys, per day.
   *
   * Straight off the wizard's own slot settings, so "1 breakfast, 1 lunch,
   * 1 dinner, 1 snack" is what the picker enforces — not just four meals of
   * any kind, which is what a bare total allowed.
   */
  const slotCounts = useMemo(() => {
    const counts = {};
    for (const s of slots) {
      if (s.enabled && s.count > 0) counts[s.slot] = s.count;
    }
    return counts;
  }, [slots]);

  const categoryIdOf = useCallback(
    (product) =>
      typeof product.categoryId === 'string'
        ? product.categoryId
        : product.categoryId?._id,
    [],
  );

  /**
   * The menu split into courses, in the order a day is eaten.
   *
   * Categories are matched by name — "Breakfast || فطور" for the breakfast
   * slot — the same way the daily box does it. A course the package does not
   * buy is left out rather than shown greyed: it is not a choice being
   * withheld, it is simply not part of this plan.
   */
  const slotGroups = useMemo(() => {
    return SLOT_ORDER.filter((slot) => slotCounts[slot]).map((slot) => {
      const category = categories.find((c) => matchesSlot(c.name, slot));
      const items = category
        ? offeredProducts.filter((p) => categoryIdOf(p) === category._id)
        : [];
      return { slot, category, items, allowance: slotCounts[slot] };
    });
  }, [categories, offeredProducts, slotCounts, categoryIdOf]);

  /** Anything whose course this package does not buy, or has no category. */
  const ungrouped = useMemo(() => {
    const grouped = new Set(slotGroups.flatMap((g) => g.items.map((p) => p._id)));
    return offeredProducts.filter((p) => !grouped.has(p._id));
  }, [offeredProducts, slotGroups]);

  /**
   * The course actually on screen.
   *
   * What they picked, as long as this package has it; otherwise the first one
   * — which is also what an unset filter means, on arriving at a new day.
   * "other" is its own course when the kitchen has dishes outside the four.
   */
  const effectiveSlotFilter = useMemo(() => {
    const available = [
      ...slotGroups.map((g) => g.slot),
      ...(ungrouped.length ? ['other'] : []),
    ];
    return available.includes(slotFilter) ? slotFilter : available[0] ?? '';
  }, [slotGroups, ungrouped, slotFilter]);

  /** How many of this course are already chosen for the day on screen. */
  const chosenInSlot = useCallback(
    (group) => group.items.filter((p) => activeIds.includes(p._id)).length,
    [activeIds],
  );

  // Lower the meals-a-day and the extra choices go with it. Leaving them
  // would send more dishes than a day has room for, and the mismatch would
  // only surface as a server refusal at the very end.
  useEffect(() => {
    if (!mealLimit) return;
    setDayMeals((prev) => {
      let touched = false;
      const next = {};
      for (const [day, ids] of Object.entries(prev)) {
        if (ids.length > mealLimit) {
          next[day] = ids.slice(0, mealLimit);
          touched = true;
        } else {
          next[day] = ids;
        }
      }
      return touched ? next : prev;
    });
  }, [mealLimit]);

  const toggleMeal = useCallback(
    (product, group) => {
      const ids = dayMeals[activeDay] || [];
      const inSlot = group
        ? ids.filter((id) => group.items.some((p) => p._id === id))
        : [];
      const wasFull = group ? inSlot.length >= group.allowance : false;

      let next;

      if (ids.includes(product._id)) {
        next = ids.filter((x) => x !== product._id);
      } else if (group && wasFull) {
        // A full course swaps: the dish chosen earliest makes way for this
        // one, in its place. Changing a breakfast used to take two taps —
        // one to un-choose it, one to choose the other — with every other
        // dish greyed out in between, which read as a menu you could not
        // order from.
        next = ids.map((id) => (id === inSlot[0] ? product._id : id));
      } else if (!group && mealLimit && ids.length >= mealLimit) {
        // Full for the day, with no course of its own to swap within.
        return;
      } else {
        next = [...ids, product._id];
      }

      setDayMeals((prev) => ({ ...prev, [activeDay]: next }));

      // Choosing the last dish a course allows moves on to the next course
      // that still needs one: the decision is finished, and staying on it
      // leaves the customer to notice that and find the next chip for
      // themselves, which is how a day two taps from done looked like forty.
      //
      // Worked out here rather than inside the state updater, which React
      // does not run when it is called — the flag set in there was read back
      // before it had been written, so nothing ever advanced.
      //
      // Only on the tap that completes a course, and never on a swap: coming
      // back to change a breakfast must not fling them forward to dinner.
      if (!group || wasFull || ids.includes(product._id)) return;
      if (inSlot.length + 1 < group.allowance) return;

      const chosen = new Set(next);
      const from = slotGroups.findIndex((g) => g.slot === group.slot);
      const onwards = slotGroups
        .slice(from + 1)
        .find((g) => g.items.filter((p) => chosen.has(p._id)).length < g.allowance);

      if (onwards) setSlotFilter(onwards.slot);
    },
    [activeDay, mealLimit, slotGroups, dayMeals],
  );

  // What the review screen reports back: how much of the week they filled in.
  const plannedCount = useMemo(
    () => Object.values(dayMeals).reduce((n, ids) => n + ids.length, 0),
    [dayMeals],
  );
  const plannedDayCount = useMemo(
    () => Object.values(dayMeals).filter((ids) => ids.length).length,
    [dayMeals],
  );

  // What the customer is actually asked for. The server prices the term
  // again at checkout and charges from its own figure; this only has to agree
  // with it, which it does because both apply the same validated code.
  const payable = promo?.totalAfterDiscount ?? quote?.total ?? 0;

  const applyPromo = async (raw) => {
    const code = String(raw ?? promoInput).trim().toUpperCase();
    if (!code || !quote) return;

    // Checking a code needs an account: a code's limits are counted per
    // customer, so the server will not price one for nobody. Signing up is
    // deferred to this screen, so a guest pressing Apply was handed the
    // authentication layer's own words — "token not exist" — in the middle
    // of a promo field. Ask properly instead, then apply the code they typed.
    if (!requireAuth(() => applyPromo(code), { reason: t('authGatePromo') })) {
      return;
    }

    setPromoBusy(true);
    setPromoError('');
    try {
      const res = await couponService.validateCoupon(code, quote.total);
      setPromo({ code, ...(res.data || {}) });
      setPromoInput('');
    } catch (err) {
      setPromo(null);
      const msg = err?.message || '';

      // A session that lapsed between opening the wizard and pressing Apply
      // is not a bad code, and saying "that code cannot be used" about a
      // perfectly good one sends people hunting for another. Ask them back in
      // and apply it for them.
      if (/token|unauthor|jwt|expired session/i.test(msg)) {
        setPromoError(t('authGatePromo'));
        requireAuth(() => applyPromo(code), { reason: t('authGatePromo') });
      } else {
        // The server's own reason where it is meant for a customer
        // ("Coupon has expired"); ours where there is none.
        setPromoError(msg || t('promoInvalid'));
      }
    } finally {
      setPromoBusy(false);
    }
  };

  const submit = async (acceptAllergens = false) => {
    if (!pkg) return;

    // The account is asked for here and nowhere earlier.
    //
    // Choosing a package, setting the macros and picking the first day are all
    // things a visitor can do while deciding — and pricing needs nobody's
    // identity, so the quote above is public too. Registering only buys
    // something once they have decided to pay, so that is where it is asked
    // for, with everything they configured still in place behind the sheet.
    if (!requireAuth(submit, { reason: t('authGatePay') })) return;

    setSubmitting(true);
    setError('');
    setAllergyPrompt('');
    try {
      // A guest's ticks reach the account here, at the first moment there
      // is one. The server checks the week against the account's list, so
      // this has to land before the checkout does.
      if (allergies.length || allergyMode === 'exact') {
        await saveAllergies();
      }
      const res = await subscriptionService.checkout({
        slug: pkg.slug,
        duration,
        selection,
        firstDayProductIds,
        // The first week, and only the days with something in them: an
        // untouched day is not an empty choice, it is no choice, and the
        // sweep fills it as before.
        firstWeeks: (() => {
          const days = Object.entries(dayMeals)
            .filter(([, ids]) => ids.length)
            .map(([dayOfWeek, productIds]) => ({
              dayOfWeek: Number(dayOfWeek),
              productIds,
            }))
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
          return days.length ? [{ weekIndex: 1, days }] : [];
        })(),
        acceptAllergens,
        ...(promo?.code && { couponCode: promo.code }),
      });
      const data = res.data || {};

      // The gateway returns to one fixed success URL for everything, carrying
      // nothing that says what was bought. These mark the return as a
      // subscription so it lands on the subscription screen rather than the
      // generic basket one, and keep the payment page reachable in case the
      // customer closed it by accident.
      try {
        if (data.orderId) sessionStorage.setItem('pending_order_id', data.orderId);
        sessionStorage.setItem('pending_subscription', '1');
        if (data.paymentUrl) {
          sessionStorage.setItem('pending_payment_url', data.paymentUrl);
        }
      } catch {
        // Storage blocked: the success page falls back to Orders.
      }

      if (data.paymentUrl) {
        // Spent on the way out, not on the way back. If the payment fails or
        // is abandoned, they land in the normal experience on their existing
        // plan — which is what should happen — and reaching the picker again
        // means asking for it again.
        endChangePlan();
        clearDraft();
        window.location.href = data.paymentUrl;
        return;
      }
      throw new Error('The payment provider did not return a page to open.');
    } catch (err) {
      const msg = err?.message || '';
      // The server names the dishes; it is the only side that knows. That
      // sentence becomes the question, so the customer is refusing or
      // accepting something specific rather than a generic warning.
      if (/allerg/i.test(msg)) {
        setAllergyPrompt(msg.replace(/^[^:]*:\s*/, ''));
      } else {
        setError(msg || 'Could not open payment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const canAdvance = () => {
    if (step === STEP.PACKAGE) return Boolean(pkg) && Boolean(preview);
    if (step === STEP.ABOUT) {
      return ['age', 'weight', 'height'].every((k) => Number(profile[k]) > 0);
    }
    return true;
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
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-2">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-primary">{STEPS[step]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ---- Step 1: package + portions ---- */}
        {step === STEP.PACKAGE && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('chooseYourPackage')}</h1>
            <p className="text-text-secondary text-sm mb-5">{t('packageIntro')}</p>

            <div className="space-y-3">
              {(pkg && !browsingPackages
                ? packages.filter((p) => p.slug === pkg.slug)
                : packages
              ).map((p) => (
                <PackageCard
                  key={p.slug}
                  pkg={p}
                  selected={pkg?.slug === p.slug}
                  recommended={p.slug === recommendedSlug}
                  onSelect={(chosen) => {
                    // Measured before the list changes, so the card can be
                    // pinned where it already is. Both directions move the
                    // page: collapsing takes cards away above it, reopening
                    // puts them back.
                    holdCardStill(chosen.slug);

                    // The card is its own switch. Pressing the one you are on
                    // brings the others back, so changing your mind is the
                    // same gesture as choosing was — no second control for it.
                    if (pkg?.slug === chosen.slug && !browsingPackages) {
                      setBrowsingPackages(true);
                      return;
                    }
                    choosePackage(chosen);
                  }}
                />
              ))}
            </div>

            {pkg && !browsingPackages && (
              <p className="mt-2.5 text-center text-xs text-text-secondary">
                {t('packageTapToSwitch')}
              </p>
            )}

            {pkg && (
              <div className="mt-6 space-y-5">
                <MacroPicker
                  title={t('mealProtein')}
                  emoji="🍗"
                  spec={pkg.protein}
                  flexible={pkg.flexible}
                  value={protein}
                  onChange={setProtein}
                  tone="protein"
                />
                <MacroPicker
                  title={t('mealCarbs')}
                  emoji="🍚"
                  spec={pkg.carbs}
                  flexible={pkg.flexible}
                  value={carbs}
                  onChange={setCarbs}
                  tone="carbs"
                />

                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="font-bold text-sm mb-1">{t('mealsInADay')}</h3>
                  <p className="text-xs text-text-secondary mb-4">
                    {pkg.minMealsPerDay}-{pkg.maxMealsPerDay} meals per day.
                  </p>
                  <div className="space-y-2">
                    {(pkg.slots || []).map((spec) => {
                      const s = slots.find((x) => x.slot === spec.slot);
                      if (!s) return null;
                      return (
                        <div
                          key={spec.slot}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSlot(spec.slot)}
                            className="flex items-center gap-2.5 min-w-0"
                          >
                            <span
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                s.enabled
                                  ? 'bg-primary border-primary'
                                  : 'border-border'
                              }`}
                            >
                              {s.enabled && (
                                <Check
                                  className="w-3 h-3 text-on-primary"
                                  strokeWidth={3}
                                />
                              )}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                s.enabled ? 'text-text' : 'text-text-secondary'
                              }`}
                            >
                              {SLOT_LABELS[spec.slot] ? t(SLOT_LABELS[spec.slot]) : spec.slot}
                            </span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSlotCount(spec.slot, -1)}
                              disabled={!s.enabled || s.count <= 0}
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:border-primary transition-colors"
                              aria-label={`One less ${spec.slot}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold tabular-nums">
                              {s.enabled ? s.count : 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSlotCount(spec.slot, 1)}
                              disabled={s.count >= (spec.maxCount ?? 2)}
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center disabled:opacity-40 hover:border-primary transition-colors"
                              aria-label={`One more ${spec.slot}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-text-secondary">
                      {previewing ? t('pricing') : t('mealsADayCount', { count: preview?.mealsPerDay ?? 0 })}
                    </span>
                    <span className="text-base font-extrabold">
                      {kd(preview?.pricePerDay)}
                      <span className="text-xs font-medium text-text-secondary">
                        {' '}
                        {t('perDayShort')}
                      </span>
                    </span>
                  </div>
                </div>

                {/* The server corrects choices it cannot honour. Saying so
                    beats letting someone find out at the price. */}
                {preview?.notes?.length > 0 && (
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-warning/10 text-sm">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
                    <ul className="space-y-1 text-text">
                      {preview.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ---- Step 2: about you ---- */}
        {step === STEP.ABOUT && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('wizardAboutTitle')}</h1>
            <p className="text-text-secondary text-sm mb-5">{t('subscribeMeasuresNote')}</p>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Age"
                  value={profile.age}
                  onChange={(v) => setProfile((p) => ({ ...p, age: v }))}
                  type="number"
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
                  type="number"
                />
                <Field
                  label="Height (cm)"
                  value={profile.height}
                  onChange={(v) => setProfile((p) => ({ ...p, height: v }))}
                  type="number"
                />
              </div>

              <div>
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

              <div>
                <label className="block text-xs font-semibold mb-1.5">{t('goal')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGoal(g.value)}
                      className={`px-2 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        goal === g.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-text-secondary hover:border-primary/40'
                      }`}
                    >
                      {t(g.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- Step 3: target ---- */}
        {step === STEP.TARGET && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('calorieCalculated')}</h1>
            <p className="text-text-secondary text-sm mb-5">{t('targetExplain')}</p>

            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{t('calculatedTarget')}</p>
              <p className="text-4xl font-extrabold text-primary mt-2 tabular-nums">
                {calories ? calories.toLocaleString() : '—'}
                <span className="text-base font-bold text-text-secondary"> kcal</span>
              </p>

              <div className="mt-5 pt-5 border-t border-border text-left">
                <label className="block text-xs font-semibold mb-1.5">{t('setItYourself')}</label>
                <input
                  type="number"
                  value={manualCalories ?? ''}
                  placeholder={calculatedCalories ? String(calculatedCalories) : ''}
                  onChange={(e) =>
                    setManualCalories(
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-text-secondary mt-2">{t('subscribeSuggestNote')}</p>
              </div>
            </div>

            {pkg && calories && (
              <div className="flex items-start gap-2 p-4 mt-4 rounded-xl bg-surface border border-border text-sm">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-text-secondary">
                  <span className="font-semibold text-text">{L(pkg.name)}</span>{' '}
                  works out to about{' '}
                  <span className="font-semibold text-text">
                    {approximateDailyCalories(pkg).toLocaleString()} kcal
                  </span>{' '}
                  a day against your {calories.toLocaleString()} kcal target.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ---- Step 4: duration ---- */}
        {step === STEP.DURATION && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('wizardDurationTitle')}</h1>
            <p className="text-text-secondary text-sm mb-5">{t('durationIntro')}</p>

            <div className="space-y-3">
              {DURATIONS.filter((d) =>
                (pkg?.durations || [1, 3, 6, 12]).includes(d.months),
              ).map((d) => {
                const perDay = preview?.pricePerDay ?? 0;
                const total = perDay * d.months * 30 * (1 - d.discount / 100);
                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setDuration(d.label)}
                    className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      duration === d.label
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          duration === d.label
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}
                      >
                        {duration === d.label && (
                          <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />
                        )}
                      </span>
                      <span className="font-bold text-sm">{t(d.labelKey)}</span>
                      {d.discount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold">
                          SAVE {d.discount}%
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-extrabold tabular-nums">
                      {kd(total)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary mt-3 text-center">{t('totalsConfirmedLater')}</p>
          </section>
        )}

        {/* ---- Step 5: allergies, before any dish is chosen ---- */}
        {step === STEP.ALLERGIES && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('wizardAllergiesTitle')}</h1>
            <p className="text-text-secondary text-sm mb-4">{t('wizardAllergiesBody')}</p>

            {/* The way out for the many who have none: one tap, nothing
                saved, straight to the meals. Hidden once something is
                ticked, because "none" and a ticked list contradict. */}
            {allergies.length === 0 ? (
              <button
                type="button"
                onClick={() => leaveAllergies({ skip: true })}
                disabled={allergySaving}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 mb-5 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {t('wizardAllergiesSkip')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 mb-5 px-4 py-3 rounded-xl bg-error/10 text-error text-sm">
                <span className="font-semibold">
                  {t('wizardAllergiesTicked', { n: allergies.length })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) setAllergyMode('exact');
                    setAllergies([]);
                  }}
                  className="text-xs font-bold underline underline-offset-2 shrink-0"
                >
                  {t('wizardAllergiesClear')}
                </button>
              </div>
            )}

            {!allergyCatalog.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {allergyCatalog.map((group) => {
                  const groupOn = allergies.includes(group.id);
                  const items = group.items || [];
                  return (
                    <div
                      key={group.id}
                      className={`rounded-2xl border p-3 transition-colors ${
                        groupOn ? 'border-error/40 bg-error/5' : 'border-border bg-surface'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAllergy(group.id)}
                        aria-pressed={groupOn}
                        className="w-full flex items-center justify-between gap-3 text-start"
                      >
                        <span className="text-sm font-extrabold">{lang === 'ar' ? group.ar : group.en}</span>
                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                            groupOn
                              ? 'border-error bg-error text-white'
                              : 'border-border text-text-secondary'
                          }`}
                        >
                          {groupOn ? t('cantEatAny') : t('wizardAllergiesAllOf')}
                        </span>
                      </button>
                      {items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {items.map((item) => {
                            // A whole group ticked covers every item in it.
                            const on = groupOn || allergies.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                disabled={groupOn}
                                aria-pressed={on}
                                onClick={() => toggleAllergy(item.id)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                                  on
                                    ? 'border-error bg-error/10 text-error'
                                    : 'border-border text-text-secondary hover:border-error/40'
                                }`}
                              >
                                {lang === 'ar' ? item.ar : item.en}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-text-secondary mt-4 text-center">
              {t('wizardAllergiesNote')}
            </p>
          </section>
        )}

        {/* ---- Step 6: the week's meals, one day at a time ---- */}
        {step === STEP.MEALS && (
          <section>
            {/* Pinned under the navbar (h-16). The day's menu is long, and
                which day this is — and the way to any other day — should stay
                in view however far down it the customer has scrolled. The
                negative margins let the background cover the section's own
                gutters, so nothing shows through at the edges. */}
            <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2 pb-1 mb-5 bg-bg border-b border-border/60">
              <h1 className="text-2xl font-extrabold mb-1">{t(DAY_KEYS[activeDay - 1])}</h1>
              <p className="text-text-secondary text-sm mb-3">
                {t('dayOfWeekProgress', { n: activeDay, total: 7 })} ·{' '}
                {t('subscribePickWeek')}
              </p>

              {/* The week at a glance. The flow is Next, day after day, but a
                  day already done should be one tap away, not seven. */}
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {DAY_KEYS.map((key, i) => {
                  const day = i + 1;
                  const count = dayIds(day).length;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => goTo({ step, day })}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        day === activeDay
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface border-border hover:border-primary/50'
                      }`}
                    >
                      {t(key)}
                      {count > 0 && (
                        <span className="ms-1.5 tabular-nums opacity-80">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* One course at a time, in the order the day is eaten, each
                  chip carrying how much of it is decided. There is no "all":
                  the whole menu at once is where the four decisions a day
                  actually holds went missing. */}
              {(slotGroups.length > 1 || ungrouped.length > 0) && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1">
                  {[
                    ...slotGroups.map((g) => ({
                      key: g.slot,
                      label: t(SLOT_LABELS[g.slot]),
                      taken: chosenInSlot(g),
                      allowance: g.allowance,
                    })),
                    ...(ungrouped.length
                      ? [{ key: 'other', label: t('slotOther'), taken: 0, allowance: 0 }]
                      : []),
                  ].map((option) => {
                    const on = effectiveSlotFilter === option.key;
                    const done = option.allowance > 0 && option.taken >= option.allowance;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSlotFilter(option.key)}
                        aria-pressed={on}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          on
                            ? 'bg-text text-surface border-text'
                            : done
                              ? 'bg-success/10 border-success/30 text-success'
                              : 'bg-surface border-border text-text-secondary hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                        {option.allowance > 0 && (
                          <span className="tabular-nums opacity-80">
                            {option.taken}/{option.allowance}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!offeredProducts.length ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-7">
                {slotGroups
                  .filter((group) => group.slot === effectiveSlotFilter)
                  .map((group) => {
                  const taken = chosenInSlot(group);
                  const full = taken >= group.allowance;

                  return (
                    <div key={group.slot}>
                      <div className="flex items-baseline justify-between gap-3 mb-2.5">
                        <h2 className="text-sm font-extrabold">
                          {t(SLOT_LABELS[group.slot])}
                        </h2>
                        <span
                          // Chosen, then allowed, in Arabic too: bidi
                          // rendered "0 / 1" as "1 / 0".
                          dir="ltr"
                          className={`text-[11px] font-bold tabular-nums ${
                            full ? 'text-success' : 'text-text-secondary'
                          }`}
                        >
                          {taken} / {group.allowance}
                        </span>
                      </div>

                      {group.items.length ? (
                        <div className="grid grid-cols-2 gap-3">
                          {group.items.map((p) => {
                            const hits = unsafeHits(p);
                            const unsafe = hits.length ? labelList(hits, allergyCatalog, lang) : null;
                            // A full course leaves the other dishes open: a
                            // tap swaps one in for the earliest chosen.
                            return (
                              <MealCard
                                key={p._id}
                                product={p}
                                chosen={activeIds.includes(p._id)}
                                blocked={Boolean(unsafe)}
                                unsafe={unsafe}
                                onToggle={() => toggleMeal(p, group)}
                                t={t}
                                L={L}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary">
                          {t('slotNoMeals')}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Anything the menu offers that is not one of this plan's
                    courses. Shown last rather than dropped, so a dish never
                    silently disappears because its category is unexpected. */}
                {ungrouped.length > 0 && effectiveSlotFilter === 'other' && (
                  <div>
                    <h2 className="text-sm font-extrabold mb-2.5">{t('slotOther')}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {ungrouped.map((p) => {
                        const hits = unsafeHits(p);
                        const unsafe = hits.length ? labelList(hits, allergyCatalog, lang) : null;
                        return (
                          <MealCard
                            key={p._id}
                            product={p}
                            chosen={activeIds.includes(p._id)}
                            blocked={
                              Boolean(unsafe) ||
                              (!activeIds.includes(p._id) &&
                                Boolean(mealLimit) &&
                                activeIds.length >= mealLimit)
                            }
                            unsafe={unsafe}
                            onToggle={() => toggleMeal(p, null)}
                            t={t}
                            L={L}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* The way to the next day is the bar's button, which is in
                view wherever the customer is on the page. */}
            <p className="text-xs text-text-secondary mt-5 text-center">
              {mealLimit
                ? t('mealsChosenOfLimit', { n: activeIds.length, limit: mealLimit })
                : t('mealsChosenOptional', { n: activeIds.length })}
            </p>
          </section>
        )}

        {/* ---- Step 6: review ---- */}
        {step === STEP.REVIEW && (
          <section>
            <h1 className="text-2xl font-extrabold mb-1">{t('reviewAndPay')}</h1>
            <p className="text-text-secondary text-sm mb-5">{t('nothingCookedUntilPaid')}</p>

            {quoting ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : quote ? (
              <>
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="p-5 border-b border-border">
                  <p className="font-extrabold text-lg">{L(quote.packageName)}</p>
                </div>

                <dl className="p-5 space-y-2.5 text-sm">
                  <Row label="Term" value={`${quote.duration} (${quote.days} days)`} />
                  <Row label="Meals a day" value={quote.mealsPerDay} />
                  <Row
                    label="Portions"
                    value={`${quote.selection?.protein}g protein · ${quote.selection?.carbs}g carbs`}
                  />
                  <Row label={t('pricePerDayLabel')} value={kd(quote.pricePerDay)} />
                  {quote.discountPercent > 0 && (
                    <>
                      <Row label={t('beforeDiscount')} value={kd(quote.gross)} muted />
                      <Row
                        label={`Discount (${quote.discountPercent}%)`}
                        value={`− ${kd(quote.gross - quote.total)}`}
                        tone="success"
                      />
                    </>
                  )}
                  {plannedCount > 0 && (
                    <Row
                      label={t('mealsPlannedLabel')}
                      value={t('mealsPlannedValue', {
                        meals: plannedCount,
                        days: plannedDayCount,
                      })}
                    />
                  )}
                </dl>

                {promo && (
                  <div className="px-5 pb-1">
                    <Row
                      label={t('promoApplied', { code: promo.code })}
                      value={`− ${kd(promo.discountAmount || 0)}`}
                      tone="success"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-5 bg-primary/5 border-t border-border">
                  <span className="font-bold">{t('cartTotal')}</span>
                  <span className="text-2xl font-extrabold text-primary tabular-nums">
                    {kd(payable)}
                  </span>
                </div>
              </div>

              {/* Codes belong where the money is, not only in the basket. */}
              <div className="mt-4 space-y-3">
                {promo ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-success/40 bg-success/5">
                    <span className="text-xs font-bold text-success">
                      {t('promoApplied', { code: promo.code })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromo(null);
                        setPromoError('');
                      }}
                      className="text-[11px] font-bold text-text-secondary hover:text-error"
                    >
                      {t('promoRemove')}
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-secondary">
                        {t('promoHaveCode')}
                      </span>
                      <span className="flex gap-2 mt-1">
                        <input
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              applyPromo();
                            }
                          }}
                          placeholder="ROCK15"
                          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm tracking-widest uppercase focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => applyPromo()}
                          disabled={promoBusy || !promoInput.trim()}
                          className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 transition-opacity"
                        >
                          {promoBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t('promoApply')
                          )}
                        </button>
                      </span>
                    </label>

                    {promoError && (
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-error">
                        <AlertCircle className="w-3 h-3" />
                        {promoError}
                      </p>
                    )}

                    <PromoCodes onApply={applyPromo} />
                  </>
                )}
              </div>
              </>
            ) : !isAuthenticated ? (
              // A visitor has configured everything and simply is not signed
              // in yet. Saying so beats an empty panel or a pricing error, and
              // the pay button below is the way through.
              <p className="text-center text-text-secondary py-8 text-sm">
                {t('quoteNeedsAccount')}
              </p>
            ) : (
              !error && (
                <p className="text-center text-text-secondary py-8">{t('couldNotPrice')}</p>
              )
            )}
          </section>
        )}

        {/* Keeps the bar from covering the end of the page on a phone. */}
        <div className="h-24 md:hidden" aria-hidden="true" />

        {/*
          Pinned to the bottom on a phone, inline from md up.

          These steps are long — five packages, two macro pickers and a meal
          list — so both the running price and the way forward sat below the
          fold. You had to scroll to the end to find out what it costs and
          scroll again to carry on. Now the total and the button travel with
          you, and the choices above update the figure in place.

          Offset clears the tab bar, which is fixed at the bottom on the same
          screens.
        */}
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-bg/95 backdrop-blur px-4 py-3 md:static md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:backdrop-blur-none md:px-0 md:py-0 md:mt-8">
          {/* The figure the choices above are changing, kept in sight. */}
          {step < STEPS.length - 1 && preview?.pricePerDay > 0 && (
            <div className="flex items-baseline justify-between mb-2 md:hidden">
              <span className="text-xs text-text-secondary">
                {previewing
                  ? t('pricing')
                  : t('mealsADayCount', { count: preview?.mealsPerDay ?? 0 })}
              </span>
              <span className="text-sm font-extrabold text-primary">
                {kd(preview.pricePerDay)}
                <span className="text-[10px] font-medium text-text-secondary"> {t('perDayShort')}</span>
              </span>
            </div>
          )}

          {/* Warned, then asked — never silently blocked.
              The dishes are named by the server; pressing through is the only
              thing that sends the acknowledgement. */}
          {allergyPrompt && (
            <div className="mb-4 p-4 rounded-2xl border border-error/30 bg-error/5">
              <p className="flex items-start gap-2 text-sm font-bold text-error mb-1">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{t('allergyOrderTitle')}</span>
              </p>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                {allergyPrompt}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllergyPrompt('')}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors"
                >
                  {t('allergyConfirmNo')}
                </button>
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {t('allergyOrderProceed')}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-bold hover:border-primary transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />{t('commonBack')}</button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (step === STEP.ALLERGIES) leaveAllergies();
                else if (moreDays) goTo({ step, day: activeDay + 1 });
                else goTo({ step: step + 1 });
              }}
              disabled={!canAdvance() || allergySaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {moreDays
                ? t('dayNext', { day: t(DAY_KEYS[activeDay]) })
                : t('commonContinue')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submit(false)}
              // A missing quote must not disable this for a visitor. The
              // quote is only what the total is displayed from — checkout
              // sends the package and selection and prices it server-side —
              // so a failed quote left the one button that opens the sign-in
              // sheet greyed out, and the deferred signup unreachable.
              disabled={submitting || (isAuthenticated && (quoting || !quote))}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {submitting ? t('openingPayment') : t('payAmount', { amount: quote ? kd(payable) : '' })}
            </button>
          )}
          </div>
        </div>

        <p className="text-center mt-5">
          <Link to="/packages" className="text-xs text-text-secondary hover:text-primary">{t('backToPackages')}</Link>
        </p>
      </div>
    </div>
  );
}

/**
 * One dish, as it appears while planning a day.
 *
 * Carries its calories and macros because this is a diet app: the choice
 * turns on those numbers, and the card used to show only a photograph and a
 * name. `blocked` is a course already full — refusing the tap and saying so
 * by going pale, rather than silently doing nothing.
 */
function MealCard({ product, chosen, blocked, unsafe = null, onToggle, t, L }) {
  return (
    <button
      type="button"
      disabled={blocked}
      onClick={onToggle}
      className={`text-left rounded-2xl border overflow-hidden transition-all ${
        chosen
          ? 'border-primary ring-1 ring-primary/20'
          : unsafe
          ? 'border-error/40 opacity-60 cursor-not-allowed'
          : blocked
          ? 'border-border opacity-45 cursor-not-allowed'
          : 'border-border hover:border-primary/40'
      }`}
    >
      {product.image?.secure_url && (
        <img
          src={product.image.secure_url}
          alt={L(product.name)}
          className="w-full h-24 object-cover"
        />
      )}
      <div className="p-3 bg-surface">
        <p className="text-xs font-bold truncate">{L(product.name)}</p>

        {/* The number and a flame: "kcal" spelt out took the room the
            dish's name needed, and the icon says it in both languages. */}
        <p
          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mt-1 tabular-nums"
          title={t('mealCaloriesLabel')}
        >
          <Flame className="w-3 h-3" aria-hidden="true" />
          <span className="sr-only">{t('mealCaloriesLabel')} </span>
          {caloriesOf(product)}
        </p>
        {/* Each macro carries its letter — three bare numbers in a row read
            as nothing in particular. */}
        <p className="text-[10px] text-text-secondary mt-0.5 tabular-nums" dir="ltr">
          <span className="text-protein">{product.protein || 0} P</span>
          {' · '}
          <span className="text-carbs">{product.carbs || 0} C</span>
          {' · '}
          <span className="text-fat">{product.fats || 0} F</span>
        </p>

        {unsafe && (
          <p className="mt-1.5 text-[10px] font-bold text-error leading-snug">
            {t('mealContains', { list: unsafe })}
          </p>
        )}

        {chosen && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-primary">
            <Check className="w-3 h-3" strokeWidth={3} />
            {t('added')}
          </span>
        )}
      </div>
    </button>
  );
}

function Row({ label, value, muted = false, tone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd
        className={`font-semibold tabular-nums ${
          tone === 'success' ? 'text-success' : muted ? 'text-text-secondary' : 'text-text'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

/**
 * Portions for one macro.
 *
 * A fixed package offers a list to choose from; a flexible one exposes a band
 * and lets any value inside it through. The two are deliberately different
 * controls — a fixed package must not be nudged off its recipe.
 */
function MacroPicker({ title, emoji, spec, flexible, value, onChange, tone }) {
  const options = spec?.options?.length ? spec.options : [spec?.grams];
  const colour = tone === 'protein' ? 'text-protein' : 'text-carbs';
  const ring = tone === 'protein' ? 'border-protein bg-protein/10' : 'border-carbs bg-carbs/10';

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">
          <span className="mr-1.5">{emoji}</span>
          {title}
        </h3>
        <span className={`text-sm font-extrabold tabular-nums ${colour}`}>
          {value}g<span className="text-xs font-medium text-text-secondary"> /day</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
              value === g ? ring : 'border-border text-text-secondary hover:border-primary/40'
            }`}
          >
            {g}g
          </button>
        ))}
      </div>

      {flexible && spec?.min != null && spec?.max != null && (
        <div className="mt-4">
          <input
            type="range"
            min={spec.min}
            max={spec.max}
            step={5}
            value={value ?? spec.min}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[11px] text-text-secondary mt-1">
            <span>{spec.min}g</span>
            <span>{spec.max}g</span>
          </div>
        </div>
      )}
    </div>
  );
}
