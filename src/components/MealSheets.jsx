import { useMemo } from 'react';
import { X, ShieldAlert, ThumbsDown, ShieldCheck, Repeat, Flame } from 'lucide-react';

import { useT } from '../i18n/useT';
import { useAllergens } from '../hooks/useAllergens';

/**
 * The two sheets a meal can open: what's in it, and what to replace it with.
 *
 * Both live here because they share the same allergy check — the point of
 * showing ingredients at all is so a customer can see why a meal is flagged,
 * and a swap that ignored their allergies would be worse than no swap.
 */

/** Products carry no calorie field; both clients derive it the same way. */
export const caloriesOf = (p) =>
  Math.round(4 * (p?.protein || 0) + 4 * (p?.carbs || 0) + 9 * (p?.fats || 0));

/**
 * Two meals are swappable when they share a category and land within 15% of
 * each other on calories — so a swap never quietly breaks the day's target.
 * The +40 gives small items room to have alternatives at all.
 */
export const isSimilar = (a, b) => {
  if (!a || !b || a._id === b._id) return false;
  const catOf = (p) =>
    typeof p.categoryId === 'string' ? p.categoryId : p.categoryId?._id;
  if (catOf(a) !== catOf(b)) return false;
  const kcal = caloriesOf(a);
  return Math.abs(caloriesOf(b) - kcal) <= Math.round(kcal * 0.15) + 40;
};

function Sheet({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-lg max-h-[90vh] bg-bg rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        <header className="flex items-start justify-between gap-3 p-4 border-b border-border bg-surface">
          <div className="min-w-0">
            <h2 className="font-extrabold truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <footer className="p-4 border-t border-border bg-surface">{footer}</footer>
        )}
      </div>
    </div>
  );
}

/** What's in this meal, and whether it is safe for this customer. */
export function MealInfoSheet({ product, onClose, onSwap }) {
  const { t, L } = useT();
  // Matched on ingredient ids with the customer's groups expanded, the same
  // way the server decides it. The substring match this used to do could not
  // see that "dairy" covers milk, and would call "egg" a hit inside
  // "eggplant" — wrong in both directions on the one question here that can
  // hurt somebody.
  const { check: checkAllergens } = useAllergens();
  const check = checkAllergens(product);

  if (!product) return null;
  const kcal = caloriesOf(product);

  return (
    <Sheet
      title={L(product.name)}
      subtitle={t('mealCalories', { count: kcal })}
      onClose={onClose}
      footer={
        onSwap && (
          <button
            type="button"
            onClick={onSwap}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold"
          >
            <Repeat className="w-4 h-4" />
            {t('mealSwap')}
          </button>
        )
      }
    >
      {product.image?.secure_url && (
        <img
          src={product.image.secure_url}
          alt={L(product.name)}
          className="w-full h-40 object-cover rounded-2xl mb-4"
        />
      )}

      {/* Allergies first: it is the only thing here that can hurt someone. */}
      {!check.known ? (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-xs mb-4">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
          {t('mealIngredientsUnknown')}
        </p>
      ) : check.hits.length ? (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-error/10 text-error text-xs mb-4">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {t('mealContainsAllergen', { items: check.label })}
        </p>
      ) : check.disliked.length ? (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-xs mb-4">
          <ThumbsDown className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
          {t('mealContainsDisliked', { items: check.dislikedLabel })}
        </p>
      ) : (
        <p className="flex items-center gap-2 p-3 rounded-xl bg-success/10 text-success text-xs mb-4">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {t('mealSafeForYou')}
        </p>
      )}

      <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">
        {t('mealNutrition')}
      </h3>
      <div className="grid grid-cols-4 gap-2 mb-5">
        <Macro label={t('mealCaloriesLabel')} value={kcal} tone="text-primary" />
        <Macro label={t('mealProtein')} value={`${product.protein || 0}g`} tone="text-protein" />
        <Macro label={t('mealCarbs')} value={`${product.carbs || 0}g`} tone="text-carbs" />
        <Macro label={t('mealFat')} value={`${product.fats || 0}g`} tone="text-fat" />
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">
        {t('mealIngredients')}
      </h3>
      {check.known ? (
        <ul className="flex flex-wrap gap-1.5">
          {product.ingredients.map((item) => (
            <li
              key={item}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-secondary leading-relaxed">
          {t('mealIngredientsUnknown')}
        </p>
      )}
    </Sheet>
  );
}

/** Replace a meal with a similar one. */
export function MealSwapSheet({ product, catalogue = [], onClose, onSelect }) {
  const { t, L } = useT();
  const { check: checkAllergens } = useAllergens();

  const alternatives = useMemo(() => {
    const similar = catalogue.filter((p) => isSimilar(product, p));
    // An alternative that trips an allergy is not an alternative.
    return similar.filter((p) => !checkAllergens(p).unsafe);
  }, [catalogue, product, checkAllergens]);

  if (!product) return null;

  return (
    <Sheet
      title={t('mealSwapTitle')}
      subtitle={t('mealSwapSubtitle')}
      onClose={onClose}
    >
      {!alternatives.length ? (
        <p className="text-center text-sm text-text-secondary py-10">
          {t('mealNoResults')}
        </p>
      ) : (
        <ul className="space-y-2">
          {alternatives.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors text-start"
              >
                {p.image?.secure_url && (
                  <img
                    src={p.image.secure_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate">
                    {L(p.name)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                    <Flame className="w-3 h-3" />
                    {t('mealCalories', { count: caloriesOf(p) })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

function Macro({ label, value, tone }) {
  return (
    <div className="text-center rounded-xl bg-surface border border-border py-2">
      <p className={`text-sm font-extrabold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}
