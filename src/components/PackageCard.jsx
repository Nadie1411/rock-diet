import { Check, Flame } from 'lucide-react';
import { useT } from '../i18n/useT';

/**
 * A package's daily calories, estimated the way the app estimates them.
 *
 * Fat is set by the recipes and varies, so it is approximated at just over
 * half a gram per gram of protein — near enough to rank packages against a
 * target, and not a figure to quote at anyone as their intake.
 */
export const approximateDailyCalories = (pkg) => {
  const protein = Number(pkg?.protein?.grams) || 0;
  const carbs = Number(pkg?.carbs?.grams) || 0;
  const fat = Math.round(protein * 0.55);
  return protein * 4 + carbs * 4 + fat * 9;
};

export default function PackageCard({
  pkg,
  selected = false,
  recommended = false,
  onSelect,
  className = '',
}) {
  const { t, L } = useT();
  const name = L(pkg.name);
  const description = L(pkg.description);
  const kcal = approximateDailyCalories(pkg);

  const interactive = typeof onSelect === 'function';
  const Tag = interactive ? 'button' : 'div';

  return (
    <Tag
      // Lets the picker find this exact card again after the list collapses,
      // so it can be held still on screen rather than jumping.
      data-pkg={pkg.slug}
      {...(interactive
        ? { type: 'button', onClick: () => onSelect(pkg), 'aria-pressed': selected }
        : {})}
      // One ramp for every plan, and no lift on hover. Four hues made the
      // shelf look like four kinds of thing rather than one thing at four
      // sizes, and a card that moves under the cursor is a card you have to
      // chase. Selection is said by the ring and the tick, not by colour.
      className={`rd-grad rd-grad-sea rd-glow w-full text-start rounded-3xl p-5 sm:p-6 text-white
        ${selected ? 'ring-2 ring-primary-light ring-offset-2 ring-offset-bg' : ''}
        ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {recommended && (
              <span className="rd-glass px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {t('recommended')}
              </span>
            )}
            {pkg.trial && (
              <span className="rd-glass px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                {t('trial')}
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
            {name}
          </h3>

          {description && (
            <p className="text-sm text-white/75 mt-1.5 leading-relaxed max-w-xs">
              {description}
            </p>
          )}
        </div>

        {/* Price opposite the name, where the eye lands after it. The currency
            rides small against the figure rather than below it, where
            "KD /meal" read as one confused unit. */}
        <div className="shrink-0 text-end">
          <p className="flex items-baseline justify-end gap-1 leading-none">
            <span className="text-[11px] font-bold text-white/70">KD</span>
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
              {Number(pkg.pricePerMeal || 0).toFixed(3)}
            </span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/65 mt-1.5">
            {t('perMeal')}
          </p>
        </div>
      </div>

      {/* The macros the kitchen actually cooks to — the reason to pick one
          plan over another, so they get glass rather than plain text. */}
      <div className="flex items-center gap-2 mt-5 flex-wrap">
        <span className="rd-glass px-3 py-1.5 rounded-xl text-xs font-bold">
          {t('gramsProtein', { g: pkg.protein?.grams })}
        </span>
        <span className="rd-glass px-3 py-1.5 rounded-xl text-xs font-bold">
          {t('gramsCarbs', { g: pkg.carbs?.grams })}
        </span>
        {pkg.flexible && (
          <span className="rd-glass px-3 py-1.5 rounded-xl text-xs font-bold">
            {t('youSetGrams')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/20">
        <span className="inline-flex items-center gap-1.5 text-xs text-white/85 font-semibold">
          <Flame className="w-3.5 h-3.5" />
          {t('aboutKcalDay', { n: kcal.toLocaleString() })}
        </span>

        {interactive && (
          <span
            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              selected
                ? 'bg-white text-primary'
                : 'border-2 border-white/45'
            }`}
          >
            {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </span>
        )}
      </div>
    </Tag>
  );
}
