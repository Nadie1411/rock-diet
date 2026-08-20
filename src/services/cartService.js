import { api } from './api';

export const cartService = {
  getCart: () => api.get('cart', { auth: true }),
  addToCart: (productId, quantity = 1, addons = []) =>
    api.post('cart', { productId, quantity, addons }, { auth: true }),
  addOfferToCart: (offerId) =>
    api.post('cart/offer', { offerId }, { auth: true }),
  updateCartItem: (productId, quantity, addons) =>
    api.patch(`cart/${productId}`, { quantity, ...(addons !== undefined && { addons }) }, { auth: true }),
  removeCartItem: (productId) =>
    api.delete(`cart/${productId}`, { auth: true }),
  clearCart: () => api.delete('cart', { auth: true }),
};
