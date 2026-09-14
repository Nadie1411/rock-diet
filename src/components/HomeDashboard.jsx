import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package as BoxIcon,
  CalendarSync,
  UtensilsCrossed,
  Tag,
  Bike,
  ChevronRight,
  Truck,
  Loader2,
  CalendarDays,
  PauseCircle,
} from 'lucide-react';

import { subscriptionService } from '../services/subscriptionService';
import { weekPlanService } from '../services/weekPlanService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

/**
 * What a signed-in customer sees first.
 *
 * The marketing page below this is written for someone deciding whether to
 * buy. Once they have, the useful thing is what is coming and what they can
 * change — which is what the app leads with, and what this mirrors: a live
 * order, the plan, the ways to order, and the next box's meals.
 */

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

/** Same-day orders close at 16:00, as on the daily box. */
const SAME_DAY_CUTOFF_HOUR = 16;

// Keys, not names: this sits at module scope where there is no translator,
// and a literal list here is how the week stayed English on an Arabic page.
// Resolved with t() at render, where the language is known.
const DAY_KEYS = [
  'dayMonday',
  'dayTuesday',
  'dayWednesday',
  'dayThursday',
  'dayFriday',
  'daySaturday',
  'daySunday',
];

const LIVE_STATUSES = ['pending', 'confirmed', 'on_the_way'];

export default function HomeDashboard() {
  const { t, L, lang } = useT();
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const mine = (call) =>
      isAuthenticated ? call() : Promise.resolve({ data: null });

    Promise.allSettled([
      mine(subscriptionService.getStatus),
      mine(weekPlanService.getUpcoming),
      mine(orderService.getUserOrders),
      productService.getPopular(),
    ]).then(([statusRes, weekRes, orderRes, popularRes]) => {
      if (!mounted) return;

      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data || null);
      if (weekRes.status === 'fulfilled') setWeeks(weekRes.value.data || []);
      if (popularRes.status === 'fulfilled') {
        setPopular((popularRes.value.data || []).slice(0, 6));
      }

      if (orderRes.status === 'fulfilled') {
        const list = orderRes.value.data?.orders ?? orderRes.value.data ?? [];
        const live = (Array.isArray(list) ? list : []).find((o) =>
          LIVE_STATUSES.includes(o.status),
        );
        setActiveOrder(live || null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
    // Re-runs on sign-in: the sheet signs someone in without leaving the
    // page, so this has to fetch what is now theirs rather than waiting for
    // a reload that never comes.
  }, [isAuthenticated]);

  /**
   * The next day that still has meals on it.
   *
   * Read from this week first and then next, so the day shown is the one
   * actually arriving rather than whichever week happened to load.
   */
  const nextDelivery = useMemo(() => {
    const todayIndex = ((new Date().getDay() + 6) % 7) + 1; // Mon = 1
    for (const [weekIndex, w] of weeks.entries()) {
      const days = w?.plan?.days ?? [];
      for (let d = 1; d <= 7; d += 1) {
        if (weekIndex === 0 && d < todayIndex) continue;
        const day = days.find((x) => x.dayOfWeek === d);
        if (day?.productIds?.length) {
          const start = new Date(w.plan.weekStart);
          start.setDate(start.getDate() + (d - 1));
          return { date: start, dayOfWeek: d, meals: day.productIds };
        }
      }
    }
    return null;
  }, [weeks]);

  const shipsTomorrow = new Date().getHours() >= SAME_DAY_CUTOFF_HOUR;
  const firstName = (user?.userName || user?.firstName || '').split(' ')[0];

  if (loading) {
    return (
      <section className="bg-bg py-10">
        <div className="max-w-5xl mx-auto px-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bg pt-8 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {firstName
              ? t('homeGreeting', { name: firstName })
              : t('homeGreetingGuest')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t('homeSubtitle')}</p>
        </header>

        {/* A live order outranks everything else on the page. */}
        {activeOrder && (
          <Link
            to={`/orders/${activeOrder._id}`}
            className="flex items-center gap-3 p-4 mb-5 rounded-2xl bg-primary text-on-primary shadow-lg hover:shadow-xl transition-shadow"
          >
            <Bike className="w-6 h-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">
                {t('orderIsStatus', {
                  ref: String(activeOrder._id).slice(-6).toUpperCase(),
                  status: activeOrder.status.replace(/_/g, ' '),
                })}
              </p>
              <p className="text-xs text-on-primary/80">
                {kd(activeOrder.totalPrice ?? activeOrder.total)} · {t('tapToTrack')}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        )}

        {/* Plan status, or the invitation to start one. */}
        {status?.active ? (
          <Link
            to="/plan"
            className={`block rounded-2xl p-5 mb-8 text-white shadow-lg transition-shadow hover:shadow-xl ${
              user?.subscriptionPaused
                ? 'bg-gradient-to-br from-slate-700 to-slate-900'
                : 'bg-gradient-to-br from-primary to-secondary'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-white/70 font-semibold uppercase tracking-wide">{t('yourPlan')}</p>
                <p className="text-lg font-extrabold truncate mt-0.5">
                  {status.package}
                </p>
                {status.subscriptionEnd && (
                  <p className="text-xs text-white/70 mt-1">
                    runs until{' '}
                    {new Date(status.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {user?.subscriptionPaused ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold shrink-0">
                  <PauseCircle className="w-3.5 h-3.5" />{t('planPaused')}</span>
              ) : (
                <ChevronRight className="w-5 h-5 shrink-0 text-white/70" />
              )}
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-5 mb-8">
            <p className="font-bold text-sm">{t('planNoSubscription')}</p>
            <p className="text-sm text-text-secondary mt-0.5 mb-4">
              {t('planNoSubscriptionDesc')}
            </p>
            <Link
              to="/packages"
              className="inline-flex px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
            >{t('packageBrowse')}</Link>
          </div>
        )}

        {/* ---- How would you like to order? ---- */}
        <h2 className="text-lg font-extrabold mb-3">{t('homeThreeWays')}</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <RouteCard
            to="/daily-box"
            Icon={BoxIcon}
            title={t('sectionDailyBox')}
            subtitle={t('sectionDailyBoxDesc')}
            tone="bg-protein/10 text-protein"
          />
          {/* Somewhere that exists for whoever is looking.
              `/subscribe` is behind the plan guard, so for a subscriber this
              card navigated and was bounced straight back here — one of the
              three main ways to order, dead for exactly the people who had
              already used it. */}
          <RouteCard
            to={status?.active ? '/plan' : '/subscribe'}
            Icon={CalendarSync}
            title={t('sectionSubscription')}
            subtitle={
              status?.active
                ? t('sectionSubscriptionMine')
                : t('sectionSubscriptionDesc')
            }
            tone="bg-primary/10 text-primary"
          />
        </div>
        <div className="space-y-3">
          <RouteCard
            to="/menu"
            Icon={UtensilsCrossed}
            title={t('orderOutsidePackage')}
            subtitle={t('orderOutsideDesc')}
            tone="bg-carbs/10 text-carbs"
            prominent
          />
          <RouteCard
            to="/offers"
            Icon={Tag}
            title={t('offersTitle')}
            subtitle={t('offersEmptyDesc')}
            tone="bg-success/10 text-success"
            horizontal
          />
        </div>

        {/* ---- Same-day strip ---- */}
        <div className="flex items-center gap-3 p-4 mt-4 rounded-2xl bg-primary/5 border border-border">
          <Truck className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="font-bold text-sm">{t('sameDayDelivery')}</p>
            <p className="text-xs text-text-secondary">
              {shipsTomorrow
                ? 'Today’s orders have closed — order now and it arrives tomorrow.'
                : t('sameDayDeliveryDesc')}
            </p>
          </div>
        </div>

        {/* ---- Upcoming meals ---- */}
        {status?.active && (
          <>
            <div className="flex items-end justify-between gap-3 mt-10 mb-3">
              <div>
                <h2 className="text-lg font-extrabold">{t('homeUpcomingMeals')}</h2>
                {nextDelivery && (
                  <p className="text-xs text-text-secondary">
                    {t(DAY_KEYS[nextDelivery.dayOfWeek - 1])}{' '}
                    {nextDelivery.date.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
              <Link
                to="/week-plan"
                className="text-sm font-bold text-primary hover:underline shrink-0"
              >
                {t('commonSeeAll')}
              </Link>
            </div>

            {nextDelivery ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {nextDelivery.meals.map((m) => {
                  const meal = typeof m === 'string' ? null : m;
                  if (!meal) return null;
                  return (
                    <Link
                      key={meal._id}
                      to={`/menu/${meal._id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface hover:border-primary/40 transition-colors"
                    >
                      {meal.image?.secure_url && (
                        <img
                          src={meal.image.secure_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold truncate">
                          {L(meal.name)}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-5 text-center">
                <CalendarDays className="w-7 h-7 mx-auto text-text-secondary/40 mb-2" />
                <p className="text-sm text-text-secondary mb-3">{t('homeNoUpcoming')}</p>
                <Link
                  to="/week-plan"
                  className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
                >{t('packageBuyGo')}</Link>
              </div>
            )}
          </>
        )}

        {/* ---- Today's popular meals ---- */}
        {popular.length > 0 && (
          <>
            <div className="flex items-end justify-between gap-3 mt-10 mb-3">
              <h2 className="text-lg font-extrabold">{t('homePopular')}</h2>
              <Link
                to="/menu"
                className="text-sm font-bold text-primary hover:underline shrink-0"
              >
                {t('commonSeeAll')}
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {popular.map((p) => (
                <Link
                  key={p._id}
                  to={`/menu/${p._id}`}
                  className="w-40 shrink-0 rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/40 transition-colors"
                >
                  {p.image?.secure_url && (
                    <img
                      src={p.image.secure_url}
                      alt={L(p.name)}
                      className="w-full h-24 object-cover"
                    />
                  )}
                  <span className="block p-3">
                    <span className="block text-xs font-bold truncate">
                      {L(p.name)}
                    </span>
                    <span className="block text-xs text-text-secondary mt-0.5">
                      {kd(p.price)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * `prominent` is for the one route people do not know exists.
 *
 * Ordering off-plan looked like a footnote in a thin strip, so nobody read
 * far enough to learn that the whole menu is open to them and that buying
 * from it — a friend's dinner, say — leaves their plan alone. Same shape as
 * the other cards, given the room its explanation needs.
 */
function RouteCard({
  to,
  Icon,
  title,
  subtitle,
  tone,
  horizontal = false,
  prominent = false,
}) {
  return (
    <Link
      to={to}
      className={`rounded-2xl border bg-surface hover:shadow-sm transition-all ${
        prominent
          ? 'border-primary/30 p-5 flex items-center gap-4'
          : `border-border p-4 hover:border-primary/50 ${
              horizontal ? 'flex items-center gap-3' : 'block'
            }`
      }`}
    >
      <span
        className={`rounded-xl flex items-center justify-center shrink-0 ${tone} ${
          prominent ? 'w-12 h-12' : 'w-10 h-10'
        } ${!horizontal && !prominent ? 'mb-3' : ''}`}
      >
        <Icon className={prominent ? 'w-6 h-6' : 'w-5 h-5'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold ${prominent ? 'text-base' : 'text-sm'}`}>
          {title}
        </span>
        <span
          className={`block text-text-secondary mt-1 ${
            prominent ? 'text-[13px] leading-relaxed' : 'text-xs mt-0.5'
          }`}
        >
          {subtitle}
        </span>
      </span>
      {(horizontal || prominent) && (
        <ChevronRight className="w-4 h-4 text-text-secondary shrink-0 rtl:rotate-180" />
      )}
    </Link>
  );
}
