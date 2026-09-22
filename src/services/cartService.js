import { api } from './api';

export const cartService = {
  getCart: () => api.get('cart', { auth: true }),
  // `addons` is only sent when there is something in it. This backend has no
  // addon module and its cart schema rejects keys it does not know, so an
  // empty array was enough to fail every add with `"addons" is not allowed` —
  // a 400 on the one action the whole shop depends on. `updateCartItem` below
  // already sent it conditionally; this one did not.
  // `packageSlug` marks a line as a day of a package — the daily box — so
  // the server prices it at the package's per-meal rate rather than the
  // dish's own price.
  addToCart: (productId, quantity = 1, addons = [], packageSlug) =>
    api.post(
      'cart',
      {
        productId,
        quantity,
        ...(addons?.length ? { addons } : {}),
        ...(packageSlug ? { packageSlug } : {}),
      },
      { auth: true },
    ),
  addOfferToCart: (offerId) =>
    api.post('cart/offer', { offerId }, { auth: true }),
  // Same guard as `addToCart` above, which this was missing: `addons !== undefined`
  // let an empty array through, and an empty array is still a field the cart
  // schema does not admit.
  updateCartItem: (productId, quantity, addons) =>
    api.patch(
      `cart/${productId}`,
      { quantity, ...(addons?.length ? { addons } : {}) },
      { auth: true },
    ),
  removeCartItem: (productId) =>
    api.delete(`cart/${productId}`, { auth: true }),
  clearCart: () => api.delete('cart', { auth: true }),
};
