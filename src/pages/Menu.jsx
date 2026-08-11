import React, { useState } from 'react';
import { Search, Plus, Check, Flame, Leaf, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MENU_ITEMS } from '../data/menuItems';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItems, setAddedItems] = useState({});

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (id) => {
    setAddedItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
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
            Chef-curated meals tailored to your macros & diet goals.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg text-text-secondary hover:bg-surface hover:text-primary border border-border'
                }`}
              >
                {cat}
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

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const count = addedItems[item.id] || 0;
              return (
                <Link
                  key={item.id}
                  to={`/menu/${item.id}`}
                  className="group block bg-bg border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {item.spicy && (
                        <span className="bg-warning text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> Spicy
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                 
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
                        <span className="text-primary uppercase tracking-wider">{item.category}</span>
                        <span className="text-text-secondary flex items-center gap-0.5">
                          <Leaf className="w-3 h-3 text-primary" /> {item.calories}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Macro badges */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface text-primary">{item.macros.protein}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-carbs/10 text-carbs">{item.macros.carbs}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-fat/10 text-fat">{item.macros.fat}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-base font-extrabold text-text">${item.price.toFixed(2)}</span>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCart(item.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          count > 0
                            ? 'bg-success text-white'
                            : 'bg-primary hover:bg-primary-light text-white'
                        }`}
                      >
                        {count > 0 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added ({count})</span>
                          </>
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
            <p className="text-text-secondary text-sm">No meals found matching "{searchQuery}".</p>
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