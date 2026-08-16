import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
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

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    try {
      setError('');
      const res = await cartService.addToCart(productId, quantity);
      setCart(res.data?.cart ?? res.data);
      openCart();
      return res;
    } catch (err) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    }
  };

  const addOfferToCart = async (offerId) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add this offer to your cart.');
    }
    try {
      setError('');
      const res = await cartService.addOfferToCart(offerId);
      setCart(res.data?.cart ?? res.data);
      openCart();
      return res;
    } catch (err) {
      setError(err.message || 'Failed to add offer to cart');
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return;
    try {
      setError('');
      const res = await cartService.updateCartItem(productId, quantity);
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || 'Failed to update item quantity');
      throw err;
    }
  };

  const removeItem = async (productId) => {
    if (!isAuthenticated) return;
    try {
      setError('');
      const res = await cartService.removeCartItem(productId);
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || 'Failed to remove item');
      throw err;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      setError('');
      const res = await cartService.clearCart();
      setCart(res.data?.cart ?? res.data);
      return res;
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
      throw err;
    }
  };

  const items = cart?.items || [];
  const cartItemCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = items.reduce((acc, item) => {
    const price = item.productId?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  const value = {
    cart,
    items,
    loading,
    isOpen,
    error,
    cartItemCount,
    subtotal,
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
