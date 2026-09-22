import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Leaf, Plus, Minus, Check, Truck, Clock, ShieldCheck, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAllergens } from '../hooks/useAllergens';
import { useAuthGate } from '../context/AuthGate';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

export default function MenuItemDetail() {
  const { t, L } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { check: checkAllergens } = useAllergens();
  const { requireAuth } = useAuthGate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await productService.getProductById(id);
        setItem(res.data);
      } catch {
        setError(t('mealNotFound'));
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-text-secondary">{t('loadingMeal')}</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-bg text-text py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-text mb-4">{t('itemNotFound')}</h1>
          <p className="text-text-secondary text-sm mb-8">{error || "The meal you're looking for doesn't exist."}</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />{t('backToMenu')}</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!requireAuth(handleAddToCart, { reason: t('authGateCart') })) return;
    setAdding(true);
    setCartError('');
    try {
      await addToCart(item._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      // Shown here rather than left to the cart context, which only records
      // it in state nothing on this page reads. A failed add that says
      // nothing looks exactly like a dead button.
      setCartError(err?.message || t('cartAddFailed'));
    } finally {
      setAdding(false);
    }
  };

  const catObj = typeof item.categoryId === 'object' ? item.categoryId : null;
  const catName = catObj ? L(catObj.name) : 'Healthy Meal';
  const imgUrl = item.image?.secure_url || '';
  const lowStock = item.stock > 0 && item.stock <= 5;

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />{t('backToMenu')}</button>

        {/* Two columns only when there is a photo to fill the left one. With
            no photo the details take a single readable column, rather than
            sitting beside a stock picture of food that isn't this dish. */}
        <div className={imgUrl ? 'grid lg:grid-cols-2 gap-10 items-start' : 'max-w-2xl'}>

          {/* Left — Image */}
          {imgUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-lg">
              <img
                src={imgUrl}
                alt={L(item.name)}
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider capitalize">
                  {catName}
                </span>
                {lowStock && (
                  <span className="bg-warning text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    Only {item.stock} left
                  </span>
                )}
              </div>

              {/* Rating pill */}
              <div className="absolute top-4 right-4 bg-bg/90 backdrop-blur-sm text-accent text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                <span>4.9</span>
              </div>
            </div>
          )}

          {/* Right — Details */}
          <div className="space-y-6">
            {/* Category + calories */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary capitalize">
                {catName}
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-primary" />{t('freshDaily')}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              {L(item.name)}
            </h1>

            {/* The pills the photo used to carry, now that it has none. */}
            {!imgUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-bg border border-border text-accent text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span>4.9</span>
                </span>
                {lowStock && (
                  <span className="bg-warning text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    Only {item.stock} left
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-text-secondary text-base leading-relaxed">
              {L(item.description) || t('mealFallbackDesc')}
            </p>

            {/* Price */}
            <div className="pt-4 border-t border-border">
              <span className="text-3xl font-extrabold text-text">
                KD {item.price.toFixed(3)}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-text">{t('quantityLabel')}</span>
              <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                  aria-label={t('decreaseQty')}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-text w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.max(1, Math.min(item.stock, quantity + 1)))}
                  className="w-8 h-8 rounded-lg bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                  aria-label={t('increaseQty')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(() => {
              // Said here, next to the price and the button, because this is
              // where someone decides. Finding out at checkout is finding out
              // too late.
              const verdict = checkAllergens(item);
              if (!verdict.unsafe) return null;
              return (
                <p className="flex items-start gap-2 p-4 mb-4 rounded-xl bg-error/10 text-error text-sm font-semibold">
                  <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                  <span>{t('mealContainsAllergen', { items: verdict.label })}</span>
                </p>
              );
            })()}

            {cartError && (
              <p className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-error/10 text-error text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{cartError}</span>
              </p>
            )}

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={adding || item.stock === 0}
              className={`w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                item.stock === 0
                  ? 'bg-disabled text-white cursor-not-allowed'
                  : added
                  ? 'bg-success text-white'
                  : 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 hover:shadow-xl'
              }`}
            >
              {adding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : added ? (
                <>
                  <Check className="w-4 h-4" />{t('addedToCart')}</>
              ) : item.stock === 0 ? (
                <span>{t('outOfStock')}</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Cart — KD {(item.price * quantity).toFixed(3)}
                </>
              )}
            </button>

            {/* Trust features */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl p-4 text-center">
                <Truck className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-semibold text-text">25-Min Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl p-4 text-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-semibold text-text">100% Organic</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-surface border border-border rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-semibold text-text">{t('freshDaily')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}