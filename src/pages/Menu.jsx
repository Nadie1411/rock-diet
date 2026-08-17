import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check, Leaf, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Menu() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, items: cartItems } = useCart();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState(null);

  // Fetch Categories & Products
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryService.getCategories(),
        productService.getProducts({ limit: 100 }),
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch {
      setError('Failed to load menu items. Please check backend connection.');
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
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingId(productId);
    try {
      await addToCart(productId, 1);
    } catch {
      // Handled in cart context
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
            Our <span className="text-primary">Menu</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Chef-curated nutritious meals prepared fresh daily.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg text-text-secondary hover:bg-surface hover:text-primary border border-border'
              }`}
            >
              All
            </button>

            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap capitalize ${
                  selectedCategory === cat._id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg text-text-secondary hover:bg-surface hover:text-primary border border-border'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search meals..."
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

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-text-secondary">Loading delicious menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const count = getItemCartCount(item._id);
              const catObj = typeof item.categoryId === 'object' ? item.categoryId : null;
              const catName = catObj ? catObj.name : 'Healthy Meal';
              const imgUrl = item.image?.secure_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

              return (
                <Link
                  key={item._id}
                  to={`/menu/${item._id}`}
                  className="group block bg-bg border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  <div className="relative h-44 overflow-hidden bg-surface">
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    
                    {/* Stock badge if low */}
                    {item.stock > 0 && item.stock <= 5 && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-warning text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Only {item.stock} left
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
                        <span className="text-primary uppercase tracking-wider capitalize">{catName}</span>
                        <span className="text-text-secondary flex items-center gap-0.5">
                          <Leaf className="w-3 h-3 text-primary" /> Fresh Daily
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'Nutritious & delicious meal crafted with high-quality ingredients.'}
                      </p>
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
                          <span>Out of Stock</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
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
            <p className="text-text-secondary text-sm">No meals found matching your filters.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}