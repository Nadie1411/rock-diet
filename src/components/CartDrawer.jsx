import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, MapPin, Phone, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { ApiError } from '../services/api';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, subtotal, cartItemCount } = useCart();

  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  if (!isOpen) return null;

  const handleProceedToCheckout = () => {
    setError('');
    if (items.length === 0) return;
    setStep('checkout');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!address.trim() || !phone.trim()) {
      setError('Please provide both delivery address and phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.createOrder({
        address: address.trim(),
        phone: phone.trim(),
        note: note.trim() || undefined,
      });
      setPlacedOrder(res.data);
      setStep('success');
      await clearCart();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to place order.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    closeCart();
    setStep('cart');
    navigate('/orders');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-bg text-text shadow-2xl flex flex-col border-l border-border">
          
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-text">
                {step === 'cart' && `Your Cart (${cartItemCount})`}
                {step === 'checkout' && 'Checkout'}
                {step === 'success' && 'Order Confirmed!'}
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: CART ITEMS LIST */}
            {step === 'cart' && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 text-text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text">Your cart is empty</h3>
                      <p className="text-xs text-text-secondary mt-1">Add some delicious healthy meals to get started!</p>
                    </div>
                    <button
                      onClick={() => {
                        closeCart();
                        navigate('/menu');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const prod = item.productId || {};
                      const img = prod.image?.secure_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                      return (
                        <div
                          key={prod._id || item._id}
                          className="bg-surface border border-border rounded-xl p-3 flex gap-3 items-center"
                        >
                          <img
                            src={img}
                            alt={prod.name || 'Meal'}
                            className="w-16 h-16 rounded-lg object-cover bg-bg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-text truncate">{prod.name}</h4>
                            <p className="text-xs font-extrabold text-primary mt-0.5">
                              ${(prod.price || 0).toFixed(2)}
                            </p>

                            {/* Quantity Control */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(prod._id, item.quantity - 1);
                                  } else {
                                    removeItem(prod._id);
                                  }
                                }}
                                className="w-6 h-6 rounded bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold text-text w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(prod._id, item.quantity + 1)}
                                className="w-6 h-6 rounded bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => removeItem(prod._id)}
                            className="p-1.5 text-text-secondary hover:text-error transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM */}
            {step === 'checkout' && (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Order Summary</h4>
                  <div className="text-xs text-text-secondary space-y-1">
                    {items.map((it) => (
                      <div key={it.productId?._id} className="flex justify-between">
                        <span>{it.quantity}x {it.productId?.name}</span>
                        <span className="font-semibold text-text">${((it.productId?.price || 0) * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-sm font-extrabold text-text">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Building, Apartment, Cairo"
                      rows={2}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 123 4567"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Delivery Notes <span className="text-text-secondary font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Leave at door, extra sauce..."
                      rows={2}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="flex-1 py-2.5 rounded-xl border border-border text-text text-xs font-semibold hover:bg-surface transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      `Confirm Order ($${subtotal.toFixed(2)})`
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-text">Order Placed Successfully!</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Order ID: <span className="font-bold text-primary">{placedOrder?._id?.slice(-8).toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    We've sent a confirmation email with your order details.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleViewOrders}
                    className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors shadow-md"
                  >
                    Track Your Orders
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer (Cart Step) */}
          {step === 'cart' && items.length > 0 && (
            <div className="p-5 border-t border-border bg-surface space-y-3">
              <div className="flex justify-between items-center text-sm font-extrabold text-text">
                <span>Subtotal</span>
                <span className="text-primary text-base">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-text-secondary">Taxes and delivery calculated at checkout.</p>
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
