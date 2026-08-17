import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  Leaf,
  TrendingUp,
  Truck,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { categoryService } from "../services/categoryService";
import { productService } from "../services/productService";
import { offerService } from "../services/offerService";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Loader2 } from "lucide-react";

const DEFAULT_OFFERS = [
    {
      id: 1,
      title: "Get 20% Off Your First Order",
      desc: "Enjoy chef-crafted healthy meals delivered to your door. Fresh, organic ingredients only.",
      code: "ROCK20",
      tag: "WELCOME DEAL",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "Free Delivery On Orders Over 10 KWD",
      desc: "Kuwait wide fast delivery directly from our gourmet kitchen. Valid for a limited time.",
      code: "FREESHIP",
      tag: "LIMITED OFFER",
      image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "Buy 3 Bowls, Get 1 Smoothie Free",
      desc: "Mix and match any of our signature healthy bowls and get a delicious detox smoothie on us.",
      code: "BOWLPLUS",
      tag: "SPECIAL BUNDLE",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    },
  ];

export default function Home() {
  const [visible, setVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [liveCategories, setLiveCategories] = useState([]);
  const [liveProducts, setLiveProducts] = useState([]);
  const [liveOffers, setLiveOffers] = useState([]);
  const [addingOfferId, setAddingOfferId] = useState(null);
  const [offerError, setOfferError] = useState("");
  const { addOfferToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Trigger entrance animations
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const offersToDisplay = liveOffers.length > 0
    ? liveOffers.map((o) => ({
        id: o._id,
        title: o.title,
        desc: o.description || '',
        code: o.promoCode || '',
        tag: o.tag || 'SPECIAL OFFER',
        image: o.image?.secure_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      }))
    : DEFAULT_OFFERS;

  useEffect(() => {
    if (offersToDisplay.length === 0) return;
    const timer = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offersToDisplay.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [offersToDisplay.length]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catRes, prodRes, offerRes] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts({ limit: 6 }),
          offerService.getOffers({ active: true }),
        ]);
        if (catRes.data && catRes.data.length > 0) {
          setLiveCategories(catRes.data);
        }
        if (prodRes.data && prodRes.data.length > 0) {
          setLiveProducts(prodRes.data);
        }
        if (offerRes.data && offerRes.data.length > 0) {
          setLiveOffers(offerRes.data);
        }
      } catch {
        // Fallback to initial display
      }
    };
    loadHomeData();
  }, []);

  const defaultCategories = [
    {
      name: "Breakfast",
      count: "Fresh & Healthy",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
      tag: "Fresh & Balanced",
    },
    {
      name: "Lunch",
      count: "High Protein",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
      tag: "Build Muscle",
    },
    {
      name: "Dinner",
      count: "Low Carb",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=80",
      tag: "Zero Guilt",
    },
    {
      name: "Snack",
      count: "Clean Energy",
      image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=500&q=80",
      tag: "Clean Reset",
    },
  ];

  const categoriesToDisplay = liveCategories.length > 0
    ? liveCategories.map((c) => ({
        id: c._id,
        name: c.name,
        count: c.description || 'Diet Special',
        image: c.image?.secure_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        tag: "Healthy Plan",
      }))
    : defaultCategories;

  const defaultPopularDishes = [
    {
      id: 1,
      name: "Avocado & Quinoa Power Bowl",
      desc: "Organic quinoa, fresh avocado, poached egg & tahini.",
      price: "4.500 KWD",
      calories: "450 kcal",
      macros: { protein: "25g P", carbs: "45g C", fat: "18g F" },
      badge: "Breakfast",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 2,
      name: "Herb Grilled Chicken & Greens",
      desc: "Free-range chicken, grilled asparagus & lemon vinaigrette.",
      price: "5.250 KWD",
      calories: "520 kcal",
      macros: { protein: "55g P", carbs: "30g C", fat: "15g F" },
      badge: "Lunch",
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 3,
      name: "Grilled Salmon Power Plate",
      desc: "Wild-caught salmon, broccoli, brown rice & sesame glaze.",
      price: "6.000 KWD",
      calories: "580 kcal",
      macros: { protein: "42g P", carbs: "38g C", fat: "22g F" },
      badge: "Dinner",
      image:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 4,
      name: "Keto Steak & Cauliflower Mash",
      desc: "Grass-fed tenderloin, herb butter & grilled asparagus.",
      price: "7.000 KWD",
      calories: "620 kcal",
      macros: { protein: "48g P", carbs: "12g C", fat: "40g F" },
      badge: "Keto",
      image:
        "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 5,
      name: "Spicy Tuna Poke Bowl",
      desc: "Sushi-grade tuna, edamame, pickled ginger & sriracha.",
      price: "5.250 KWD",
      calories: "490 kcal",
      macros: { protein: "35g P", carbs: "42g C", fat: "16g F" },
      badge: "Spicy",
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 6,
      name: "Green Detox Smoothie Bowl",
      desc: "Spinach, banana, mango, chia seeds & granola.",
      price: "3.250 KWD",
      calories: "290 kcal",
      macros: { protein: "12g P", carbs: "38g C", fat: "8g F" },
      badge: "Vegan",
      image:
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const dishesToDisplay = liveProducts.length > 0
    ? liveProducts.map((p) => {
        const catObj = typeof p.categoryId === 'object' ? p.categoryId : null;
        const totalCals = (p.protein || 0) * 4 + (p.carbs || 0) * 4 + (p.fats || 0) * 9;
        return {
          id: p._id,
          name: p.name,
          desc: p.description || 'Fresh chef-crafted healthy meal.',
          price: `${p.price?.toFixed(3)} KD`,
          calories: totalCals > 0 ? `${totalCals} kcal` : 'Nutritious',
          macros: {
            protein: `${p.protein || 0}g P`,
            carbs: `${p.carbs || 0}g C`,
            fat: `${p.fats || 0}g F`,
          },
          badge: catObj ? catObj.name : 'Rock Diet',
          image: p.image?.secure_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          linkTo: `/menu/${p._id}`,
        };
      })
    : defaultPopularDishes;

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOrderOffer = async (offerId) => {
    if (!isAuthenticated) {
      setOfferError("Please login to order this offer.");
      return;
    }
    setOfferError("");
    setAddingOfferId(offerId);
    try {
      await addOfferToCart(offerId);
    } catch (err) {
      setOfferError(err.message || "Failed to add offer to cart.");
    } finally {
      setAddingOfferId(null);
    }
  };

  return (
    <div className="bg-bg text-text">
      {/* ================= HERO — 100vh ================= */}
      <section
        id="home"
        className="relative h-screen min-h-[600px] overflow-hidden"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* Background layer */}
        <div className="absolute inset-0">
          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=2000&q=80"
            alt=""
            className="w-full h-full object-cover"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-primary/90 to-primary/85" />

          {/* Decorative blobs */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] bg-primary-light/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl" />

          {/* Subtle grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text content */}
            <div
              className={`space-y-7 transition-all duration-700 ease-out ${
                visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {/* Announcement pill */}
            
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
                Fuel Your Body
                <br />
                with{" "}
                <span className="relative inline-block">
                  <span className="text-accent">Rock Diet</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3"
                    viewBox="0 0 200 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9C50 3 150 3 198 7"
                      stroke="var(--color-accent)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="text-white/70 text-base sm:text-lg max-w-lg leading-relaxed text-white">
                Chef-crafted nutritious meals tailored to your macros & diet
                goals. Freshly prepared daily and delivered to your door.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  to="/menu"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent hover:bg-primary-light text-white font-bold text-sm shadow-lg shadow-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5"
                >
                  <span>Explore Menu</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>

                <button
                  onClick={() => scrollToSection("categories")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all duration-300"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Discover More</span>
                </button>
              </div>
            </div>

            {/* Right — Visual stack */}
            <div
              className={`hidden lg:block relative transition-all duration-700 delay-200 ease-out ${
                visible
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 translate-x-12 scale-95"
              }`}
            >
              {/* Main image card */}
              <div className="relative mx-auto max-w-[480px]">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-accent/20 rounded-3xl blur-2xl" />

                <div className="relative rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl p-3 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                    alt="Rock Diet Signature Bowl"
                    className="w-full h-[420px] object-cover rounded-2xl"
                  />

                  {/* Floating badge card */}
                  <div className="absolute -bottom-5 left-6 right-6 bg-white rounded-2xl p-4 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                        <Flame className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text">
                          Rock Diet Signature
                        </p>
                        <p className="text-xs text-text-secondary">
                          Salmon Power Bowl · 580 kcal
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-extrabold text-primary">
                      6.000 KWD
                    </span>
                  </div>



                </div>

                {/* Floating delivery badge */}
                <div className="absolute -left-8 top-16 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-bounce-slow">
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text">
                      Fast Delivery
                    </p>
                    <p className="text-[10px] text-text-secondary">Avg. 25 minutes</p>
                  </div>
                </div>

                {/* Floating organic badge */}
                <div className="absolute -right-6 bottom-24 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text">
                      100% Organic
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      Farm-fresh daily
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollToSection("categories")}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors group"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            Scroll
          </span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section id="categories" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
                <Leaf className="w-4 h-4" />
                <span>Diet Plans</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Explore Our Categories
              </h2>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-light group"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categoriesToDisplay.map((cat, idx) => (
              <Link
                key={cat.id || idx}
                to="/menu"
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-bg text-text shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
              >
                {/* Card Media */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                </div>

                {/* Card Body */}
                <div className="flex flex-col gap-2 p-5 flex-1">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                    {cat.tag}
                  </span>
                  <h3 className="text-xl font-bold text-text">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {cat.count}
                  </p>
                </div>

                {/* Card Action overlay */}
                <div className="absolute top-3 right-3 w-10 h-10 bg-primary/30 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= POPULAR DISHES — GALLERY GRID ================= */}
      <section className="py-20 bg-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              <Flame className="w-4 h-4" />
              <span>Chef Favorites</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              Today's Popular Meals
            </h2>
            <p className="text-text-secondary mt-3 text-sm">
              Handpicked by our chefs based on what our community loves most.
            </p>
          </div>

          {/* Uniform grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishesToDisplay.map((dish) => (
              <div
                key={dish.id}
                className="group"
              >
                <div className="relative overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  {/* Image */}
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider z-10">
                    {dish.badge}
                  </div>

                  {/* Price pill */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-sm font-extrabold px-3 py-1 rounded-full shadow-sm z-10">
                    {dish.price}
                  </div>

                  {/* Hover overlay — slides up from bottom */}
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col justify-center items-center text-center p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
                      {dish.calories}
                    </span>
                    <h3 className="text-white font-bold text-xl mb-2">
                      {dish.name}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-4">
                      {dish.desc}
                    </p>

                    {/* Macro chips */}
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-protein/20 text-protein border border-protein/30">
                        {dish.macros.protein}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-carbs/20 text-carbs border border-carbs/30">
                        {dish.macros.carbs}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-fat/20 text-fat border border-fat/30">
                        {dish.macros.fat}
                      </span>
                    </div>

                    <Link
                      to={dish.linkTo || "/menu"}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-primary-light text-white text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <span>Order Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SPECIAL OFFERS CAROUSEL ================= */}
      <section className="py-20 bg-surface border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Exclusive Promotions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              Special Offers & Deals
            </h2>
            <p className="text-text-secondary mt-3 text-sm">
              Eat clean and save smart with our weekly chef specials and discounts.
            </p>
          </div>

          {/* Carousel Wrapper */}
          <div className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl bg-bg border border-border shadow-xl">
            {/* Carousel Slides */}
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentOffer * 100}%)` }}
            >
              {offersToDisplay.map((offer) => (
                <div
                  key={offer.id}
                  className="w-full shrink-0 flex flex-col md:flex-row items-stretch"
                >
                  {/* Left Side: Info & Promo Code */}
                  <div className="flex-1 p-8 sm:p-12 flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {offer.tag}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-text leading-tight">
                      {offer.title}
                    </h3>
                    
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {offer.desc}
                    </p>

                    {offer.code && (
                      <div className="inline-flex items-center gap-2 self-start bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Promo Code:</span>
                        <span className="text-sm font-extrabold text-primary tracking-widest">{offer.code}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleOrderOffer(offer.id)}
                        disabled={addingOfferId === offer.id}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-primary-light text-white text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${
                          addingOfferId === offer.id ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {addingOfferId === offer.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Order This Offer
                          </>
                        )}
                      </button>
                      {isAuthenticated && (
                        <Link
                          to="/menu"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-light"
                        >
                          Browse Menu
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    {offerError && (
                      <p className="text-xs font-semibold bg-error/10 text-error border border-error/20 rounded-lg px-3 py-2">
                        {offerError}
                      </p>
                    )}
                  </div>

                  {/* Right Side: Image Show */}
                  <div className="w-full md:w-5/12 h-64 md:h-auto relative overflow-hidden group/img">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                    />
                    {/* Shadow overlay to fade image into left info card */}
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-bg via-transparent to-transparent" />
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <button
              onClick={() =>
                setCurrentOffer((prev) => (prev - 1 + offersToDisplay.length) % offersToDisplay.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-border text-text hover:text-primary hover:border-primary flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 active:scale-95 z-10"
              aria-label="Previous Offer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                setCurrentOffer((prev) => (prev + 1) % offersToDisplay.length)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 border border-border text-text hover:text-primary hover:border-primary flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 active:scale-95 z-10"
              aria-label="Next Offer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {offersToDisplay.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentOffer(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentOffer === idx ? "bg-primary w-5" : "bg-disabled hover:bg-text-secondary"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES / WHY US ================= */}
      <section className="py-20 bg-secondary text-white relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        

          {/* Map */}
          <div className="mt-16 grid lg:grid-cols-3 gap-6 items-stretch">
            {/* Map iframe */}
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
              <iframe
                title="Rock Diet Location"
                src="https://maps.google.com/maps?q=Kuwait%20City%2C%20Kuwait&t=&z=12&ie=UTF8&iwloc=&output=embed"
                className="w-full h-[320px] lg:h-full min-h-[320px] border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* Map overlay label */}
              <div className="absolute top-4 left-4 bg-secondary/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-lg">
                <p className="text-white font-bold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  Rock Diet HQ
                </p>
                <p className="text-white text-[11px] mt-0.5">
                  Kuwait City, Kuwait
                </p>
              </div>
            </div>

            {/* Location info card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-center gap-5">
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-accent text-white"/>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">
                  Find Us
                </h3>
                <p className="text-white text-xs leading-relaxed">
                  Visit our flagship kitchen or check if we deliver to your
                  neighborhood.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-white text-xs font-semibold">Address</p>
                    <p className="text-white text-[11px] mt-0.5">
                      15 Mubarak Al-Kabeer St, Kuwait City, Kuwait
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-white text-xs font-semibold">
                      Opening Hours
                    </p>
                    <p className="text-white text-[11px] mt-0.5">
                      Daily · 8:00 AM – 12:00 AM
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-accent mt-0.5 shrink-0 text-white" />
                  <div>
                    <p className="text-white text-xs font-semibold">
                      Delivery Radius
                    </p>
                    <p className="text-white text-[11px] mt-0.5">
                      Within 15 km of downtown
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-primary-light text-white text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                <span>Order to This Area</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-light px-8 py-12 sm:px-12 sm:py-16 text-center">
            {/* Decorative */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent/20 rounded-full blur-2xl" />

            <div className="relative z-10 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-4 text-white">
                <TrendingUp className="w-4 h-4 text-white" />
                <span>Repeat Last Week's Menu</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Loved your meals? Order them again.
              </h2>
              <p className="text-white text-sm mt-3">
                Reschedule your favorite weekly menu in seconds — it's that
                simple.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span>Start Ordering</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/orders"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review Orders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}