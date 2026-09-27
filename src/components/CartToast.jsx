import { useEffect } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useT } from '../i18n/useT';

/**
 * "Added to cart", without taking the page away.
 *
 * Adding a meal used to throw the cart drawer open. For the customer buying
 * one thing that is fine; for everyone else it is four drawers to close while
 * picking four meals, each one covering the menu being picked from. So the
 * drawer stays shut, and this strip carries the one thing the drawer was
 * doing usefully: saying the add worked, naming the dish, and offering the
 * cart to whoever actually wants it. It leaves on its own after a moment.
 */

const VISIBLE_MS = 3200;

export default function CartToast() {
  const { lastAdded, dismissLastAdded, openCart, isOpen, cartItemCount } =
    useCart();
  const { t, L } = useT();

  useEffect(() => {
    if (!lastAdded) return undefined;
    const timer = setTimeout(dismissLastAdded, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  // The drawer is the same news in full. Two of them at once is just noise.
  const show = Boolean(lastAdded) && !isOpen;
  const name = lastAdded?.name ? L(lastAdded.name) : '';

  const seeCart = () => {
    dismissLastAdded();
    openCart();
  };

  /*
   * Sits above the support button rather than beside it: on a phone that
   * button is pinned bottom-end, and a centred strip at the same height lands
   * underneath it. The region itself stays mounted and empty so that a screen
   * reader announces each add — a live region that appears along with its own
   * text is usually missed.
   */
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(7.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      {show && (
        <div className="animate-rise-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-2xl">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-text">
              {name || t('addedToCart')}
            </p>
            {name && (
              <p className="text-xs text-text-secondary">{t('addedToCart')}</p>
            )}
          </div>

          <button
            type="button"
            onClick={seeCart}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-colors hover:bg-primary-light"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{t('viewCart')}</span>
            <span className="rounded-full bg-black/15 px-1.5 text-[10px] leading-4">
              {cartItemCount}
            </span>
          </button>

          <button
            type="button"
            onClick={dismissLastAdded}
            aria-label={t('commonClose')}
            className="shrink-0 rounded-lg p-1 text-text-secondary transition-colors hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
