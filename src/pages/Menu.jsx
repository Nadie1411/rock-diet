import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check, Leaf, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAllergens } from '../hooks/useAllergens';
import { useAuthGate } from '../context/AuthGate';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

export default function Menu() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const { check: checkAllergens } = useAllergens();
  const { requireAuth } = useAuthGate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');
  const [addingId, setAddingId] = useState(null);

  // Fetch Categories & Products
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryService.getCategories(),
        productService.getAllProducts(),
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch {
      setError(t('menuLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter products by selected category and search text
  const filteredItems = products.filter((item) => {
    const itemCatId = typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId;
    const matchesCategory =
      selectedCategory === 'All' || itemCatId === selectedCategory;

    const matchesSearch =
      L(item.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      L(item.name).includes(searchQuery) ||
      (item.description && L(item.description).toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    // Asks in place and then carries on, rather than throwing the page away
    // and leaving them to find this meal again.
    if (!requireAuth(() => handleAddToCart(e, productId), { reason: t('authGateCart') })) return;

    setAddingId(productId);
    setCartError('');
    try {
      await addToCart(productId, 1);
    } catch (err) {
      setCartError(err?.message || t('cartAddFailed'));
    } finally {
      setAddingId(null);
    }
  };

  // Get current quantity of item in backend cart
  const getItemCartCount = (productId) => {
    const found = cartItems.find((it) => (it.productId?._id || it.productId) === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
            {t('menuHeading')}
          </h1>
          <p className="text-text-secondary text-sm">
            {t('menuSubtitle')}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-primary text-white shadow-sm border border-transparent'
                  : 'bg-bg text-text-secondary hover:bg-surface hover:text-primary border border-border'
              }`}
            >
              {t('commonAll')}
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 capitalize ${
                  selectedCategory === cat._id
                    ? 'bg-primary text-white shadow-sm border border-transparent'
                    : 'bg-bg text-text-secondary hover:bg-surface hover:text-primary border border-border'
                }`}
              >
                {L(cat.name)}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={t('mealSearchHint')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {cartError && (
          <div className="mb-6 flex items-center gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cartError}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-text-secondary">{t('commonLoading')}</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const count = getItemCartCount(item._id);
              const catObj = typeof item.categoryId === 'object' ? item.categoryId : null;
              const catName = catObj ? L(catObj.name) : 'Healthy Meal';
              const imgUrl = item.image?.secure_url || '';
              const unsafe = checkAllergens(item).unsafe;
              const lowStock = item.stock > 0 && item.stock <= 5;
              const protein = Math.round(item.protein || 0);
              const carbs = Math.round(item.carbs || 0);
              const fats = Math.round(item.fats || 0);
              const calories = Math.round(protein * 4 + carbs * 4 + fats * 9);

              return (
                <Link
                  key={item._id}
                  to={`/menu/${item._id}`}
                  className="group block bg-bg border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  {/* No photo yet, no photo slot — a stock picture of someone
                      else's food is worse than none. The badges it carried
                      move into the card body below. */}
                  {imgUrl && (
                    <div className="relative h-44 overflow-hidden bg-surface">
                      <img
                        src={imgUrl}
                        alt={L(item.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                      />

                      {/* Stock badge if low */}
                      {lowStock && (
                        <div className="absolute top-2.5 start-2.5">
                          <span className="bg-warning text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {t('onlyNLeft', { count: item.stock })}
                          </span>
                        </div>
                      )}

                      {/* Flagged on the card, so a meal that could hurt this
                          customer is obvious while they are still scanning the
                          menu — not after they have paid for it. */}
                      {unsafe && (
                        <div className="absolute top-2.5 end-2.5">
                          <span className="flex items-center gap-1 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            <ShieldAlert className="w-3 h-3" />
                            {t('allergyBadge')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
                        <span className="text-primary uppercase tracking-wider capitalize">{catName}</span>
                        <span className="text-text-secondary flex items-center gap-0.5">
                          <Leaf className="w-3 h-3 text-primary" />{t('freshDaily')}</span>
                      </div>

                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                        {L(item.name)}
                      </h3>

                      {/* With no photo above, the allergy warning has nowhere
                          to sit — and it is the one thing on this card that
                          must not be dropped. */}
                      {!imgUrl && (unsafe || lowStock) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {unsafe && (
                            <span className="flex items-center gap-1 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              <ShieldAlert className="w-3 h-3" />
                              {t('allergyBadge')}
                            </span>
                          )}
                          {lowStock && (
                            <span className="bg-warning text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {t('onlyNLeft', { count: item.stock })}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">
                        {L(item.description) || 'Nutritious & delicious meal crafted with high-quality ingredients.'}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                          {calories} kcal
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-protein/10 text-protein text-[10px] font-bold">
                          P {protein}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-carbs/10 text-carbs text-[10px] font-bold">
                          C {carbs}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-fat/10 text-fat text-[10px] font-bold">
                          F {fats}g
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-base font-extrabold text-text">KD {item.price.toFixed(3)}</span>

                      <button
                        onClick={(e) => handleAddToCart(e, item._id)}
                        disabled={addingId === item._id || item.stock === 0}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          item.stock === 0
                            ? 'bg-disabled text-white cursor-not-allowed'
                            : count > 0
                            ? 'bg-success text-white'
                            : 'bg-primary hover:bg-primary-light text-white'
                        }`}
                      >
                        {addingId === item._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : count > 0 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added ({count})</span>
                          </>
                        ) : item.stock === 0 ? (
                          <span>{t('menuOutOfStock')}</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('menuAdd')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-bg rounded-xl border border-border">
            <p className="text-text-secondary text-sm">{t('mealNoResults')}</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >{t('resetFilters')}</button>
          </div>
        )}
      </div>
    </div>
  );
}