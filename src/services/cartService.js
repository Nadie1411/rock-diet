import { api } from './api';

export const cartService = {
  getCart: () => api.get('cart', { auth: true }),
  addToCart: (productId, quantity = 1) =>
    api.post('cart', { productId, quantity }, { auth: true }),
  addOfferToCart: (offerId) =>
    api.post('cart/offer', { offerId }, { auth: true }),
  updateCartItem: (productId, quantity) =>
    api.patch(`cart/${productId}`, { quantity }, { auth: true }),
  removeCartItem: (productId) =>
    api.delete(`cart/${productId}`, { auth: true }),
  clearCart: () => api.delete('cart', { auth: true }),
};
