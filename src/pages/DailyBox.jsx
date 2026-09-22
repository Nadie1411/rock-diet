import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Clock,
  Shuffle,
  ShoppingCart,
  Check,
  Info,
} from 'lucide-react';

import { packageService } from '../services/packageService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useAllergens } from '../hooks/useAllergens';
import { useAuthGate } from '../context/AuthGate';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useT } from '../i18n/useT';
import { MealInfoSheet, MealSwapSheet } from '../components/MealSheets';

/**
 * "Order a meal box for today" — a pre-built day of meals the customer can
 * tweak, then send straight to checkout. No subscription required.
 *
 * The box is built from the package the customer actually bought, so someone
 * on five meals with two snacks gets their day rather than everybody's
 * default. A guest, or a subscriber buying a one-off, gets the trial package —
 * which is exactly what a one-day box is.
 */

/** Same-day orders close at 16:00; after that the box ships tomorrow. */
const SAME_DAY_CUTOFF_HOUR = 16;

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

export default function DailyBox() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { check: checkAllergens } = useAllergens();
  const { requireAuth } = useAuthGate();
  const { addToCart, openCart } = useCart();

  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [picked, setPicked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [inspecting, setInspecting] = useState(null);
  const [swapping, setSwapping] = useState(null);

  useEffect(() => {
    Promise.all([
      packageService.getPackages(),
      productService.getAllProducts(),
      categoryService.getCategories().catch(() => ({ data: [] })),
    ])
      .then(([pkgRes, prodRes, catRes]) => {
        setPackages(pkgRes.data || []);
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch((err) => setError(err?.message || t('boxBuildFailed')))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  /**
   * A subscriber's own package, so the box matches what they already eat;
   * otherwise the trial package, which is what a one-day box is.
   */
  const pkg = useMemo(() => {
    if (!packages.length) return null;
    const mine = user?.package
      ? packages.find((p) => p.slug === user.package)
      : null;
    return mine ?? packages.find((p) => p.trial) ?? packages[0];
  }, [packages, user]);

  /** How many of each slot this package's day is made of. */
  const slotCounts = useMemo(() => {
    const counts = {};
    for (const s of pkg?.slots || []) {
      if (s.enabled !== false) counts[s.slot] = s.defaultCount ?? 1;
    }
    return counts;
  }, [pkg]);

  /**
   * Matched on the English half of `"Breakfast || فطور"`, not the translated
   * name: matching what is displayed meant this found nothing in Arabic, and
   * the box was then seeded from the whole menu with no regard for which
   * course a dish belonged to.
   */
  const categoryBySlot = useCallback(
    (slot) =>
      categories.find((c) =>
        String(c.name ?? '').split('||')[0].trim().toLowerCase().startsWith(slot),
      )?._id,
    [categories],
  );

  const seedBox = useCallback(() => {
    if (!products.length || !Object.keys(slotCounts).length) return;

    const chosen = [];
    for (const [slot, count] of Object.entries(slotCounts)) {
      const catId = categoryBySlot(slot);
      const options = products.filter((p) => {
        const pc = typeof p.categoryId === 'string' ? p.categoryId : p.categoryId?._id;
        if (catId && pc !== catId) return false;
        // Nothing the kitchen has run out of: the box would offer it, the
        // basket would refuse it, and the customer would be told
        // "insufficient stock" about a dish they never asked for.
        if (!(Number(p.stock) > 0)) return false;
        // Never seed a plate the customer has said they can't eat.
        //
        // Matched on ingredient ids with groups expanded. The substring test
        // here before compared the raw id "dairy" against a product whose
        // ingredients are ["laban"] — which never matches, so a dairy allergy
        // silently seeded labneh and yoghurt into the box.
        return !checkAllergens(p).unsafe;
      });
      for (let i = 0; i < count && options.length; i += 1) {
        const pick = options[Math.floor(Math.random() * options.length)];
        if (pick && !chosen.includes(pick._id)) chosen.push(pick._id);
      }
    }
    setPicked(chosen);
  }, [products, slotCounts, categoryBySlot, checkAllergens]);

  useEffect(() => {
    if (!picked.length) seedBox();
  }, [seedBox, picked.length]);

  const productById = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p._id, p);
    return m;
  }, [products]);

  /**
   * A box is a day of the package, and the package prices it: its per-meal
   * rate times the meals in the box. The dishes' own prices are the
   * à-la-carte figures and do not apply here — summing them charged nothing
   * for the imported menu and nearly double the package rate for the demo
   * dishes, and never matched what the package advertises. The server prices
   * the same way when the order is placed, so this is what will be charged.
   */
  const perMeal = Number(pkg?.pricePerMeal ?? 0);
  const total = perMeal
    ? perMeal * picked.length
    : picked.reduce((sum, id) => sum + Number(productById.get(id)?.price || 0), 0);

  /** After 16:00 the kitchen has already loaded the vans for today. */
  const shipsTomorrow = new Date().getHours() >= SAME_DAY_CUTOFF_HOUR;

  const orderBox = async () => {
    if (!requireAuth(orderBox, { reason: t('authGateBox') })) return;
    setAdding(true);
    setError('');
    try {
      // Under the package, so the basket and the order price each meal at
      // the package's rate rather than the dish's own.
      for (const id of picked) {
        await addToCart(id, 1, [], pkg?.slug);
      }
      openCart();
    } catch (err) {
      setError(err?.message || t('boxAddFailed'));
    } finally {
      setAdding(false);
    }
  };

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
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">{t('boxForToday')}</h1>
          <p className="text-text-secondary text-sm mt-1">
            A full day of meals, built from{' '}
            {pkg ? <strong>{L(pkg.name)}</strong> : 'our standard day'}. Swap
            anything you like, then order — no subscription needed.
          </p>
        </header>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          className={`flex items-start gap-2.5 p-4 mb-5 rounded-xl text-sm ${
            shipsTomorrow ? 'bg-warning/10' : 'bg-success/10'
          }`}
        >
          <Clock
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              shipsTomorrow ? 'text-warning' : 'text-success'
            }`}
          />
          <span>
            {shipsTomorrow ? (
              <>
                <strong>{t('arrivesTomorrow')}</strong>{t('dailyBoxCutoff')}</>
            ) : (
              <>
                <strong>{t('arrivesToday')}</strong>{t('orderBefore16')}</>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-bold text-sm">
            {picked.length} {picked.length === 1 ? 'meal' : 'meals'} in this box
          </h2>
          <button
            type="button"
            onClick={seedBox}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:border-primary transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />{t('shuffle')}</button>
        </div>

        <ul className="space-y-2">
          {picked.map((id) => {
            const p = productById.get(id);
            if (!p) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface"
              >
                {p.image?.secure_url && (
                  <img
                    src={p.image.secure_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setInspecting(p)}
                  className="min-w-0 flex-1 text-start hover:text-primary transition-colors"
                >
                  <span className="block text-sm font-semibold truncate">{L(p.name)}</span>
                  <span className="block text-xs text-text-secondary mt-0.5">
                    {p.protein}p · {p.carbs}c · {p.fats}f
                  </span>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold">{kd(perMeal || p.price)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPicked((prev) => prev.filter((x) => x !== id))
                    }
                    className="p-1.5 rounded-lg text-text-secondary hover:text-error transition-colors"
                    aria-label={`Remove ${L(p.name)}`}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {!picked.length && (
          <p className="text-center text-text-secondary py-10 text-sm">{t('emptyBox')}</p>
        )}

        <div className="mt-6">
          <p className="flex items-start gap-2 text-xs text-text-secondary mb-3">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {t('boxAllergyNote')}{' '}
            <Link to="/restrictions" className="text-primary font-semibold">{t('editRestrictions')}</Link>
          </p>

          <div className="sticky bottom-4 rounded-2xl border border-border bg-surface p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">{t('boxTotal')}</span>
              <span className="text-xl font-extrabold tabular-nums">
                {kd(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={orderBox}
              disabled={adding || !picked.length}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {isAuthenticated ? t('boxAddToBasket') : t('signInToOrder')}
            </button>
          </div>
        </div>
      </div>

      {inspecting && !swapping && (
        <MealInfoSheet
          product={inspecting}
          onClose={() => setInspecting(null)}
          onSwap={() => setSwapping(inspecting)}
        />
      )}

      {swapping && (
        <MealSwapSheet
          product={swapping}
          catalogue={products}
          onClose={() => setSwapping(null)}
          onSelect={(replacement) => {
            // Swap in place so the box keeps its slot order.
            setPicked((prev) =>
              prev.map((x) => (x === swapping._id ? replacement._id : x)),
            );
            setSwapping(null);
            setInspecting(null);
          }}
        />
      )}
    </div>
  );
}
