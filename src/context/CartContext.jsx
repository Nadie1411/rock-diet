import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  // The failure messages below are shown to the customer, so they are
  // translated. Without this they read `t` from nowhere at all and throw a
  // ReferenceError instead — which is what a signed-out customer got for
  // pressing "add", in place of being asked to sign in.
  const { t } = useLanguage();

  // These functions get captured by callers — the auth gate replays an add
  // that was created while signed out, and the copy it holds closed over
  // `isAuthenticated === false`. Reading through a ref makes every guard see
  // the live value instead of whatever was true when the closure was made,
  // so a replayed add succeeds instead of refusing for not being logged in.
  // Assigned during render, not from an effect. This provider sits above the
  // auth gate, and child effects run before parent ones — so an effect here
  // would still hold the old value at the moment the gate replays a queued
  // add, and the guard below would refuse it for not being signed in. During
  // render it is simply always current.
  const authed = useRef(isAuthenticated);
  authed.current = isAuthenticated;
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const refreshCart = useCallback(async () => {
    if (!authed.current) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const res = await cartService.getCart();
      setCart(res.data?.cart ?? res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  /**
   * The drawer opens when it is asked for, and not because something landed
   * in the cart.
   *
   * Adding used to open it every single time. That suits the customer buying
   * one thing and nobody else: choosing four meals meant four drawers to
   * close, each one thrown over the menu being chosen from. What the drawer
   * was doing by accident — confirming the add — `lastAdded` does instead,
   * through the strip at the bottom of the screen.
   *
   * Flows that really are finished still open it themselves: ordering a box,
   * or reordering a past order.
   */
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  /**
   * The dish just added, for the strip that says so — cleared on a timer.
   *
   * The name is taken from the cart the server sends back rather than from
   * the caller: callers have only an id, while the line it lands on carries
   * the dish populated, and in both languages.
   */
  const [lastAdded, setLastAdded] = useState(null);
  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  const noteAdded = (nextCart, productId) => {
    const line = (nextCart?.items || []).find(
      (item) => (item.productId?._id || item.productId) === productId,
    );
    setLastAdded({
      id: productId,
      name: line?.productId?.name ?? null,
      at: Date.now(),
    });
  };

  const addToCart = async (productId, quantity = 1, addons = [], packageSlug) => {
    if (!authed.current) {
      throw new Error(t('cartLoginToAdd'));
    }
    try {
      setError('');
      const res = await cartService.addToCart(productId, quantity, addons, packageSlug);
      const next = res.data?.cart ?? res.data;
      setCart(next);
      noteAdded(next, productId);
      return res;
    } catch (err) {
      setError(err.message || t('cartAddFailed'));
      throw err;
    }
  };

  const addOfferToCart = async (offerId) => {
    if (!authed.current) {
      throw new Error(t('cartLoginForOffer'));
    }
    try {
      setError('');
      const res = await cartService.addOfferToCart(offerId);
      setCart(res.data?.cart ?? res.data);
      setLastAdded({ id: offerId, name: null, at: Date.now() });
      return res;
    } catch (err) {
      setError(err.message || t('cartAddOfferFailed'));
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity, addons) => {
    if (!authed.current) return;
    try {
      setError('');
      const res = await cartService.updateCartItem(productId, quantity, addons);
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || t('cartUpdateQtyFailed'));
      throw err;
    }
  };

  const removeItem = async (productId) => {
    if (!authed.current) return;
    try {
      setError('');
      const res = await cartService.removeCartItem(productId);
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || t('cartRemoveFailed'));
      throw err;
    }
  };

  const clearCart = async () => {
    if (!authed.current) return;
    try {
      setError('');
      const res = await cartService.clearCart();
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || t('cartClearFailed'));
      throw err;
    }
  };

  const items = cart?.items || [];
  const cartItemCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  // `unitPrice` is what the server will actually charge the line at — the
  // package rate for a box, the dish's own price otherwise. Falling back to
  // the product price keeps an older cart shape working.
  const subtotal = items.reduce((acc, item) => {
    const price = item.unitPrice ?? item.productId?.price ?? 0;
    const addonsTotal = (item.selectedAddons || []).reduce(
      (sum, addon) => sum + (addon.price || 0),
      0,
    );
    return acc + (price + addonsTotal) * item.quantity;
  }, 0);

  const value = {
    cart,
    items,
    loading,
    isOpen,
    error,
    cartItemCount,
    subtotal,
    lastAdded,
    dismissLastAdded,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    addOfferToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
