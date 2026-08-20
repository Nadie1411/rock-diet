import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { orderService } from "../services/orderService";
import { couponService } from "../services/couponService";
import { offerService } from "../services/offerService";
import { addonService } from "../services/addonService";
import { ApiError } from "../services/api";

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    cartItemCount,
  } = useCart();

  const [step, setStep] = useState("cart"); // 'cart' | 'checkout' | 'success'
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("kw");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState([]);
  const [globalAddons, setGlobalAddons] = useState([]);
  const [expandedAddons, setExpandedAddons] = useState({});
  const [addonLoading, setAddonLoading] = useState(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef(null);

  const COUNTRIES = [
    { code: "kw", flag: "🇰🇼", dial: "+965", name: "Kuwait" },
    { code: "sa", flag: "🇸🇦", dial: "+966", name: "Saudi Arabia" },
    { code: "ae", flag: "🇦🇪", dial: "+971", name: "UAE" },
    { code: "qa", flag: "🇶🇦", dial: "+974", name: "Qatar" },
    { code: "bh", flag: "🇧🇭", dial: "+973", name: "Bahrain" },
    { code: "om", flag: "🇴🇲", dial: "+968", name: "Oman" },
    { code: "eg", flag: "🇪🇬", dial: "+20", name: "Egypt" },
    { code: "jo", flag: "🇯🇴", dial: "+962", name: "Jordan" },
    { code: "lb", flag: "🇱🇧", dial: "+961", name: "Lebanon" },
    { code: "iq", flag: "🇮🇶", dial: "+964", name: "Iraq" },
    { code: "sy", flag: "🇸🇾", dial: "+963", name: "Syria" },
    { code: "ps", flag: "🇵🇸", dial: "+970", name: "Palestine" },
    { code: "ye", flag: "🇾🇪", dial: "+967", name: "Yemen" },
    { code: "ly", flag: "🇱🇾", dial: "+218", name: "Libya" },
    { code: "tn", flag: "🇹🇳", dial: "+216", name: "Tunisia" },
    { code: "dz", flag: "🇩🇿", dial: "+213", name: "Algeria" },
    { code: "ma", flag: "🇲🇦", dial: "+212", name: "Morocco" },
    { code: "sd", flag: "🇸🇩", dial: "+249", name: "Sudan" },
    { code: "so", flag: "🇸🇴", dial: "+252", name: "Somalia" },
    { code: "dj", flag: "🇩🇯", dial: "+253", name: "Djibouti" },
    { code: "km", flag: "🇰🇲", dial: "+269", name: "Comoros" },
    { code: "mr", flag: "🇲🇷", dial: "+222", name: "Mauritania" },
    { code: "tr", flag: "🇹🇷", dial: "+90", name: "Turkey" },
    { code: "in", flag: "🇮🇳", dial: "+91", name: "India" },
    { code: "pk", flag: "🇵🇰", dial: "+92", name: "Pakistan" },
    { code: "ph", flag: "🇵🇭", dial: "+63", name: "Philippines" },
    { code: "us", flag: "🇺🇸", dial: "+1", name: "USA" },
    { code: "gb", flag: "🇬🇧", dial: "+44", name: "UK" },
  ];

  const selectedCountry = COUNTRIES.find((c) => c.code === phoneCountry) || COUNTRIES[0];

  // Reset drawer state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep("cart");
      setAddress("");
      setPhone("");
      setPhoneCountry("kw");
      setNote("");
      setLoading(false);
      setError("");
      setPlacedOrder(null);
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponError("");
      setCouponLoading(false);
      setExpandedAddons({});
      setAddonLoading(null);
      setCountryOpen(false);
    }
  }, [isOpen]);

  // Close country dropdown on outside click
  useEffect(() => {
    if (!countryOpen) return;
    const handleClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [countryOpen]);

  // Load active offers for promo-code discovery
  useEffect(() => {
    let mounted = true;
    offerService
      .getOffers({ active: true })
      .then((res) => {
        if (mounted) setAvailableOffers(res.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Load all active addons globally
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    addonService
      .getAddons({ isActive: true })
      .then((res) => {
        if (mounted) setGlobalAddons(res.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToCheckout = () => {
    setError("");
    if (items.length === 0) return;
    setStep("checkout");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedAddress = address.trim();
    const trimmedPhone = phone.trim();
    const fullPhone = `${selectedCountry.dial} ${trimmedPhone}`;

    if (!trimmedAddress) {
      setError("Please provide your delivery address.");
      return;
    }
    if (trimmedAddress.length < 5) {
      setError("Delivery address must be at least 5 characters.");
      return;
    }
    if (!trimmedPhone) {
      setError("Please provide your phone number.");
      return;
    }
    if (trimmedPhone.length < 6) {
      setError("Phone number must be at least 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await orderService.createOrder({
        address: trimmedAddress,
        phone: fullPhone,
        note: note.trim() || undefined,
        ...(appliedCoupon?.code && { couponCode: appliedCoupon.code }),
      });
      const data = res.data || {};
      const order = data.order || {};
      setPlacedOrder(order);
      await clearCart();
      // If backend returns a payment URL (Stripe Checkout), redirect to it
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setStep("success");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error.map((e) => e.message).join(" "));
        } else {
          setError(err.message || "Failed to place order.");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    closeCart();
    setStep("cart");
    navigate("/orders");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setError("");
    try {
      const res = await couponService.validateCoupon(
        couponCode.trim(),
        subtotal,
      );
      setAppliedCoupon(res.data);
      setCouponCode("");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Invalid coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleApplyOfferCode = (code) => {
    setCouponCode(code);
    setAppliedCoupon(null);
    setCouponError("");
  };

  const toggleAddonsPanel = (productId) => {
    setExpandedAddons((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleToggleAddon = async (item, addon) => {
    const productId = item.productId?._id;
    if (!productId) return;

    const currentAddons = item.selectedAddons || [];
    const isCurrentlySelected = currentAddons.some(
      (a) => (a.addonId?._id || a.addonId) === addon._id,
    );

    let newAddons;
    if (isCurrentlySelected) {
      newAddons = currentAddons.filter(
        (a) => (a.addonId?._id || a.addonId) !== addon._id,
      );
    } else {
      newAddons = [
        ...currentAddons,
        { addonId: addon._id, name: addon.name, price: addon.price },
      ];
    }

    setAddonLoading(productId);
    try {
      await updateQuantity(productId, item.quantity, newAddons);
    } catch {
    } finally {
      setAddonLoading(null);
    }
  };

  const isAddonSelected = (item, addonId) => {
    return (item.selectedAddons || []).some(
      (a) => (a.addonId?._id || a.addonId) === addonId,
    );
  };

  const getItemAddonTotal = (item) => {
    return (item.selectedAddons || []).reduce(
      (sum, addon) => sum + (addon.price || 0),
      0,
    );
  };

  const displaySubtotal = appliedCoupon?.discountAmount
    ? Math.max(0, subtotal - appliedCoupon.discountAmount)
    : subtotal;

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
                {step === "cart" && `Your Cart (${cartItemCount})`}
                {step === "checkout" && "Checkout"}
                {step === "success" && "Order Confirmed!"}
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
            {step === "cart" && (
              <>
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 text-text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text">
                        Your cart is empty
                      </h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Add some delicious healthy meals to get started!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        closeCart();
                        navigate("/menu");
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
                      const img =
                        prod.image?.secure_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";

                      return (
                        <div
                          key={prod._id || item._id}
                          className="bg-surface border border-border rounded-xl p-3 flex gap-3 items-center"
                        >
                          <img
                            src={img}
                            alt={prod.name || "Meal"}
                            className="w-16 h-16 rounded-lg object-cover bg-bg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-text truncate">
                              {prod.name}
                            </h4>
                            <p className="text-xs font-extrabold text-primary mt-0.5">
                              KD {(prod.price || 0).toFixed(3)}
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
                                onClick={() =>
                                  updateQuantity(prod._id, item.quantity + 1)
                                }
                                className="w-6 h-6 rounded bg-bg hover:bg-border flex items-center justify-center text-text transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => removeItem(prod._id)}
                              className="p-1.5 text-text-secondary hover:text-error transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: CHECKOUT FORM */}
            {step === "checkout" && (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Order Summary
                  </h4>
                  <div className="text-xs text-text-secondary space-y-1.5">
                    {items.map((it) => {
                      const addonsTotal = getItemAddonTotal(it);
                      return (
                        <div key={it.productId?._id}>
                          <div className="flex justify-between">
                            <span>
                              {it.quantity}x {it.productId?.name}
                            </span>
                            <span className="font-semibold text-text">
                              KD{" "}
                              {((it.productId?.price || 0) * it.quantity).toFixed(
                                3,
                              )}
                            </span>
                          </div>
                          {(it.selectedAddons || []).map((addon, idx) => (
                            <div
                              key={addon.addonId?._id || idx}
                              className="flex justify-between pl-4 text-text-secondary"
                            >
                              <span className="text-[10px]">
                                + {addon.name}
                              </span>
                              <span className="text-[10px] font-semibold">
                                +KD {(addon.price || 0).toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-sm font-extrabold text-text">
                    <span>Subtotal</span>
                    <span>KD {subtotal.toFixed(3)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Coupon {appliedCoupon.code} applied
                      </span>
                      <span className="text-success">
                        -KD {appliedCoupon.discountAmount.toFixed(3)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-extrabold text-text">
                    <span>Total</span>
                    <span className="text-primary">
                      KD {displaySubtotal.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
                  <label className="block text-xs font-semibold text-text mb-1">
                    Coupon Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-success tracking-wide">
                        {appliedCoupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-semibold text-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter promo code"
                        className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-text text-xs placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-bold tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {couponLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[10px] font-semibold text-error flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {couponError}
                    </p>
                  )}
                </div>

                {/* Available Promo Codes */}
                {availableOffers.length > 0 && !appliedCoupon && (
                  <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Available Promo Codes
                    </p>
                    <div className="space-y-1.5">
                      {availableOffers.map((offer) => (
                        <button
                          key={offer._id}
                          type="button"
                          onClick={() => handleApplyOfferCode(offer.promoCode)}
                          disabled={!offer.promoCode}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-bg border border-border hover:border-primary transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span className="min-w-0">
                            <span className="block text-[10px] font-extrabold text-primary tracking-widest">
                              {offer.promoCode}
                            </span>
                            <span className="block text-[10px] text-text-secondary truncate">
                              {offer.title}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] font-bold text-warning">
                            {offer.discountPercent > 0 &&
                              `${offer.discountPercent}% OFF`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-secondary">
                      Tap a code to apply it, then press Apply.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Building, Area, Kuwait City"
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
                  <div className="flex gap-2">
                    <div className="relative shrink-0" ref={countryRef}>
                      <button
                        type="button"
                        onClick={() => setCountryOpen((p) => !p)}
                        className="flex items-center gap-1.5 w-[110px] px-2.5 py-2 rounded-lg bg-bg border border-border text-text text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span className="text-text-secondary text-[11px]">{selectedCountry.dial}</span>
                        <ChevronDown className="w-3 h-3 text-text-secondary ml-auto" />
                      </button>
                      {countryOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 max-h-52 overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-50">
                          {COUNTRIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setPhoneCountry(c.code);
                                setCountryOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                                c.code === phoneCountry
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "text-text hover:bg-bg"
                              }`}
                            >
                              <span className="text-base leading-none">{c.flag}</span>
                              <span className="font-semibold">{c.name}</span>
                              <span className="text-text-secondary ml-auto">{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="5512 3456"
                        className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text text-xs placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Delivery Notes{" "}
                    <span className="text-text-secondary font-normal">
                      (optional)
                    </span>
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
                    onClick={() => setStep("cart")}
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
                      `Confirm Order (KD ${displaySubtotal.toFixed(3)})`
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "success" && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-text">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Order ID:{" "}
                    <span className="font-bold text-primary">
                      {placedOrder?._id?.slice(-8).toUpperCase()}
                    </span>
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
          {step === "cart" && items.length > 0 && (
            <div className="p-5 border-t border-border bg-surface space-y-3">
              {/* Addon selection panels */}
              {items.map((item) => {
                const prod = item.productId || {};
                if (globalAddons.length === 0) return null;

                const isExpanded = !!expandedAddons[prod._id];
                const isLoading = addonLoading === prod._id;
                const addonCount = (item.selectedAddons || []).length;
                const addonTotal = getItemAddonTotal(item);

                return (
                  <div
                    key={`addons-${prod._id || item._id}`}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAddonsPanel(prod._id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-bg hover:bg-border/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-bold text-text">
                          Add-ons for {prod.name}
                        </span>
                        {addonCount > 0 && (
                          <span className="text-[10px] font-bold text-on-primary bg-primary rounded-full px-1.5 py-0.5">
                            {addonCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {addonTotal > 0 && (
                          <span className="text-[10px] font-bold text-primary">
                            +KD {addonTotal.toFixed(3)}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-text-secondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-secondary" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 py-2 space-y-1.5 border-t border-border bg-surface">
                        {isLoading && (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          </div>
                        )}
                        {!isLoading &&
                          globalAddons.map((addon) => {
                            const selected = isAddonSelected(item, addon._id);
                            return (
                              <label
                                key={addon._id}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                  selected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      selected
                                        ? "bg-primary border-primary"
                                        : "border-border"
                                    }`}
                                  >
                                    {selected && (
                                      <CheckCircle2 className="w-3 h-3 text-on-primary" />
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-text truncate">
                                    {addon.name}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-primary shrink-0">
                                  +KD {(addon.price || 0).toFixed(3)}
                                </span>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={selected}
                                  onChange={() =>
                                    handleToggleAddon(item, addon)
                                  }
                                />
                              </label>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-between items-center text-sm font-extrabold text-text">
                <span>Subtotal</span>
                <span className="text-primary text-base">
                  KD {subtotal.toFixed(3)}
                </span>
              </div>

              <p className="text-[10px] text-text-secondary">
                Taxes and delivery calculated at checkout.
              </p>

              {/* Continue Shopping */}
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate("/menu");
                }}
                className="w-full py-2.5 rounded-xl border border-border text-text text-xs font-semibold hover:bg-bg hover:border-primary hover:text-primary transition-colors"
              >
                Continue Shopping
              </button>

              {/* Checkout */}
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
