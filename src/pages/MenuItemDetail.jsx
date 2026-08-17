import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Leaf, Plus, Minus, Check, Truck, Clock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function MenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        setError('Meal not found or error loading product details.');
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
        <p className="text-xs font-semibold text-text-secondary">Loading meal details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-bg text-text py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-text mb-4">Item Not Found</h1>
          <p className="text-text-secondary text-sm mb-8">{error || "The meal you're looking for doesn't exist."}</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(item._id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // Error handled in cart context
    } finally {
      setAdding(false);
    }
  };

  const catObj = typeof item.categoryId === 'object' ? item.categoryId : null;
  const catName = catObj ? catObj.name : 'Healthy Meal';
  const imgUrl = item.image?.secure_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          
          {/* Left — Image */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-lg">
            <img
              src={imgUrl}
              alt={item.name}
              className="w-full h-[400px] lg:h-[500px] object-cover"
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider capitalize">
                {catName}
              </span>
              {item.stock <= 5 && (
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

          {/* Right — Details */}
          <div className="space-y-6">
            {/* Category + calories */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary capitalize">
                {catName}
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-primary" /> Fresh Daily
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              {item.name}
            </h1>

            {/* Description */}
            <p className="text-text-secondary text-base leading-relaxed">
              {item.description || 'Prepared fresh daily by our executive chefs using top-tier organic ingredients to keep you energized and healthy.'}
            </p>

            {/* Price */}
            <div className="pt-4 border-t border-border">
              <span className="text-3xl font-extrabold text-text">
                KD {item.price.toFixed(3)}
              </span>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-text">Quantity:</span>
              <div className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3 py-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-text w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

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
                  <Check className="w-4 h-4" />
                  Added to Cart!
                </>
              ) : item.stock === 0 ? (
                <span>Out of Stock</span>
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
                <span className="text-[11px] font-semibold text-text">Fresh Daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}