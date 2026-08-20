import React, { useState, useEffect, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  Layers,
  Package,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  RefreshCw,
  Sparkles,
  Ticket,
  Puzzle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { categoryService } from "../services/categoryService";
import { productService } from "../services/productService";
import { orderService } from "../services/orderService";
import { offerService } from "../services/offerService";
import { couponService } from "../services/couponService";
import { addonService } from "../services/addonService";
import { ApiError } from "../services/api";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "on_the_way",
  "delivered",
  "cancelled",
];

const COUPON_DISCOUNT_TYPES = ["percent", "fixed"];

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "products"); // 'categories' | 'products' | 'orders' | 'offers' | 'coupons'

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  // Offers & Coupons state
  const [offers, setOffers] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);

  // Addons state
  const [addons, setAddons] = useState([]);
  const [addonLoading, setAddonLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals & forms
  const [modalType, setModalType] = useState(null); // 'createCategory' | 'editCategory' | 'createProduct' | 'editProduct' | 'createOffer' | 'editOffer' | 'createCoupon' | 'editCoupon'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch {
      setError("Failed to fetch categories.");
    } finally {
      setCatLoading(false);
    }
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch {
      setError("Failed to fetch products.");
    } finally {
      setProdLoading(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setOrderLoading(true);
    try {
      const res = await orderService.getAllOrders({
        status: statusFilter || undefined,
        limit: 50,
      });
      setOrders(res.data || []);
    } catch {
      setError("Failed to fetch admin orders.");
    } finally {
      setOrderLoading(false);
    }
  }, [statusFilter]);

  // Fetch Offers
  const fetchOffers = useCallback(async () => {
    setOfferLoading(true);
    try {
      const res = await offerService.getOffers();
      setOffers(res.data || []);
    } catch {
      setError("Failed to fetch offers.");
    } finally {
      setOfferLoading(false);
    }
  }, []);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    setCouponLoading(true);
    try {
      const res = await couponService.getCoupons();
      setCoupons(res.data || []);
    } catch {
      setError("Failed to fetch coupons.");
    } finally {
      setCouponLoading(false);
    }
  }, []);

  // Fetch Addons
  const fetchAddons = useCallback(async () => {
    setAddonLoading(true);
    try {
      const res = await addonService.getAddons();
      setAddons(res.data || []);
    } catch {
      setError("Failed to fetch addons.");
    } finally {
      setAddonLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchProducts();
      fetchOrders();
      fetchOffers();
      fetchCoupons();
      fetchAddons();
    }
  }, [
    isAdmin,
    fetchCategories,
    fetchProducts,
    fetchOrders,
    fetchOffers,
    fetchCoupons,
    fetchAddons,
  ]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const closeModal = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
    setImageFile(null);
    setImagePreview(null);
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // CATEGORY ACTIONS
  const handleOpenCreateCategory = () => {
    setFormData({ name: "", description: "" });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setModalType("createCategory");
  };

  const handleOpenEditCategory = (cat) => {
    setSelectedItem(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setImageFile(null);
    setImagePreview(cat.image?.secure_url || null);
    setError("");
    setModalType("editCategory");
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.name) data.append("name", formData.name.trim());
      if (formData.description !== undefined)
        data.append("description", formData.description.trim());
      if (imageFile) data.append("image", imageFile);

      if (modalType === "createCategory") {
        await categoryService.createCategory(data);
        setSuccess("Category created successfully!");
      } else {
        await categoryService.updateCategory(selectedItem._id, data);
        setSuccess("Category updated successfully!");
      }

      closeModal();
      fetchCategories();
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || "Action failed.");
        }
      } else {
        setError("Network error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await categoryService.deleteCategory(catId);
      setSuccess("Category deleted successfully!");
      fetchCategories();
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    }
  };

  // PRODUCT ACTIONS
  const handleOpenCreateProduct = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      protein: "25",
      carbs: "30",
      fats: "15",
      categoryId: categories[0]?._id || "",
    });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setModalType("createProduct");
  };

  const handleOpenEditProduct = (prod) => {
    setSelectedItem(prod);
    const catId =
      typeof prod.categoryId === "object"
        ? prod.categoryId?._id
        : prod.categoryId;
    setFormData({
      name: prod.name,
      description: prod.description || "",
      price: prod.price,
      stock: prod.stock,
      protein: prod.protein ?? 0,
      carbs: prod.carbs ?? 0,
      fats: prod.fats ?? 0,
      categoryId: catId || "",
    });
    setImageFile(null);
    setImagePreview(prod.image?.secure_url || null);
    setError("");
    setModalType("editProduct");
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.name) data.append("name", formData.name.trim());
      if (formData.description)
        data.append("description", formData.description.trim());
      if (formData.price !== undefined && formData.price !== "")
        data.append("price", Number(formData.price));
      if (formData.stock !== undefined && formData.stock !== "")
        data.append("stock", Number(formData.stock));
      if (formData.protein !== undefined && formData.protein !== "")
        data.append("protein", Number(formData.protein));
      if (formData.carbs !== undefined && formData.carbs !== "")
        data.append("carbs", Number(formData.carbs));
      if (formData.fats !== undefined && formData.fats !== "")
        data.append("fats", Number(formData.fats));
      if (formData.categoryId) data.append("categoryId", formData.categoryId);
      if (imageFile) data.append("image", imageFile);

      if (modalType === "createProduct") {
        await productService.createProduct(data);
        setSuccess("Product created successfully!");
      } else {
        await productService.updateProduct(selectedItem._id, data);
        setSuccess("Product updated successfully!");
      }

      closeModal();
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || "Action failed.");
        }
      } else {
        setError("Network error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await productService.deleteProduct(prodId);
      setSuccess("Product deleted successfully!");
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete product.");
    }
  };

  // ORDER STATUS UPDATE
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order status updated to ${newStatus}!`);
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    }
  };

  // OFFER ACTIONS
  const handleOpenCreateOffer = () => {
    setFormData({
      title: "",
      description: "",
      promoCode: "",
      discountPercent: 10,
      tag: "",
      active: true,
      startDate: "",
      endDate: "",
      products: [],
    });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setModalType("createOffer");
  };

  const handleOpenEditOffer = (offer) => {
    setSelectedItem(offer);
    setFormData({
      title: offer.title,
      description: offer.description || "",
      promoCode: offer.promoCode || "",
      discountPercent: offer.discountPercent ?? 0,
      tag: offer.tag || "SPECIAL OFFER",
      active: offer.active ?? true,
      startDate: offer.startDate ? offer.startDate.slice(0, 10) : "",
      endDate: offer.endDate ? offer.endDate.slice(0, 10) : "",
      products: (offer.products || []).map((p) =>
        typeof p === "object" ? p._id : p,
      ),
    });
    setImageFile(null);
    setImagePreview(offer.image?.secure_url || null);
    setError("");
    setModalType("editOffer");
  };
  const handleToggleOfferProduct = (productId) => {
    setFormData((prev) => {
      const current = prev.products || [];
      const exists = current.includes(productId);
      return {
        ...prev,
        products: exists
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      };
    });
  };
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.title) data.append("title", formData.title.trim());
      if (formData.description)
        data.append("description", formData.description.trim());
      if (formData.promoCode)
        data.append("promoCode", formData.promoCode.trim().toUpperCase());
      if (formData.discountPercent !== undefined)
        data.append("discountPercent", Number(formData.discountPercent));
      if (formData.tag) data.append("tag", formData.tag.trim());
      data.append("active", formData.active ? "true" : "false");
      if (formData.startDate) data.append("startDate", formData.startDate);
      if (formData.endDate) data.append("endDate", formData.endDate);
      if (imageFile) data.append("image", imageFile);
      (formData.products || []).forEach((pid) => data.append("products", pid));

      if (modalType === "createOffer") {
        await offerService.createOffer(data);
        setSuccess("Offer created successfully!");
      } else {
        await offerService.updateOffer(selectedItem._id, data);
        setSuccess("Offer updated successfully!");
      }

      closeModal();
      fetchOffers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || "Action failed.");
        }
      } else {
        setError("Network error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      await offerService.deleteOffer(offerId);
      setSuccess("Offer deleted successfully!");
      fetchOffers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete offer.");
    }
  };

  // COUPON ACTIONS
  const handleOpenCreateCoupon = () => {
    setFormData({
      code: "",
      discountType: "percent",
      discountValue: 10,
      minOrder: 0,
      maxDiscount: "",
      active: true,
      expiryDate: "",
      usageLimit: "",
      perUserLimit: 1,
    });
    setError("");
    setModalType("createCoupon");
  };

  const handleOpenEditCoupon = (coupon) => {
    setSelectedItem(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrder: coupon.minOrder ?? 0,
      maxDiscount: coupon.maxDiscount ?? "",
      active: coupon.active ?? true,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      usageLimit: coupon.usageLimit ?? "",
      perUserLimit: coupon.perUserLimit ?? 1,
    });
    setError("");
    setModalType("editCoupon");
  };

  const handleSubmitCoupon = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrder: Number(formData.minOrder || 0),
        active: !!formData.active,
        expiryDate: formData.expiryDate,
        perUserLimit: Number(formData.perUserLimit || 1),
      };
      if (formData.maxDiscount !== undefined && formData.maxDiscount !== "")
        payload.maxDiscount = Number(formData.maxDiscount);
      if (formData.usageLimit !== undefined && formData.usageLimit !== "")
        payload.usageLimit = Number(formData.usageLimit);

      if (modalType === "createCoupon") {
        await couponService.createCoupon(payload);
        setSuccess("Coupon created successfully!");
      } else {
        await couponService.updateCoupon(selectedItem._id, payload);
        setSuccess("Coupon updated successfully!");
      }

      closeModal();
      fetchCoupons();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || "Action failed.");
        }
      } else {
        setError("Network error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await couponService.deleteCoupon(couponId);
      setSuccess("Coupon deleted successfully!");
      fetchCoupons();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete coupon.");
    }
  };

  // ADDON ACTIONS
  const handleOpenCreateAddon = () => {
    setFormData({ name: "", description: "", price: "", isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setModalType("createAddon");
  };

  const handleOpenEditAddon = (addon) => {
    setSelectedItem(addon);
    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price,
      isActive: addon.isActive ?? true,
    });
    setImageFile(null);
    setImagePreview(addon.image?.secure_url || null);
    setError("");
    setModalType("editAddon");
  };

  const handleSubmitAddon = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.name) data.append("name", formData.name.trim());
      if (formData.description !== undefined)
        data.append("description", formData.description.trim());
      if (formData.price !== undefined && formData.price !== "")
        data.append("price", Number(formData.price));
      data.append("isActive", formData.isActive ? "true" : "false");
      if (imageFile) data.append("image", imageFile);

      if (modalType === "createAddon") {
        await addonService.createAddon(data);
        setSuccess("Addon created successfully!");
      } else {
        await addonService.updateAddon(selectedItem._id, data);
        setSuccess("Addon updated successfully!");
      }

      closeModal();
      fetchAddons();
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || "Action failed.");
        }
      } else {
        setError("Network error.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm("Are you sure you want to delete this addon?")) return;
    try {
      await addonService.deleteAddon(addonId);
      setSuccess("Addon deleted successfully!");
      fetchAddons();
      fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete addon.");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text mt-1">
              Store <span className="text-primary">Management</span>
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
              Manage categories, meals catalog, and customer orders.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-border shadow-sm">
            <button
              onClick={() => { setActiveTab("products"); setSearchParams({ tab: "products" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "products"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Package className="w-4 h-4" />
              Products ({products.length})
            </button>
            <button
              onClick={() => { setActiveTab("categories"); setSearchParams({ tab: "categories" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "categories"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Layers className="w-4 h-4" />
              Categories ({categories.length})
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setSearchParams({ tab: "orders" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab("offers"); setSearchParams({ tab: "offers" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "offers"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Offers ({offers.length})
            </button>
            <button
              onClick={() => { setActiveTab("coupons"); setSearchParams({ tab: "coupons" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "coupons"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Ticket className="w-4 h-4" />
              Coupons ({coupons.length})
            </button>
            <button
              onClick={() => { setActiveTab("addons"); setSearchParams({ tab: "addons" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "addons"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              <Puzzle className="w-4 h-4" />
              Addons ({addons.length})
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mb-6 flex items-center justify-between bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-between bg-success/10 text-success text-xs font-semibold px-4 py-3 rounded-lg border border-success/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text">Meals & Products</h2>
              <button
                onClick={handleOpenCreateProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {prodLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : products.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No products found</p>
                <button
                  onClick={handleOpenCreateProduct}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-border text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-4">Image</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs text-text">
                      {products.map((prod) => {
                        const catName =
                          typeof prod.categoryId === "object"
                            ? prod.categoryId?.name
                            : "Uncategorized";
                        return (
                          <tr
                            key={prod._id}
                            className="hover:bg-bg/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <img
                                src={
                                  prod.image?.secure_url ||
                                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"
                                }
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover bg-bg border border-border"
                              />
                            </td>
                            <td className="py-3 px-4 font-bold text-text">
                              <div>{prod.name}</div>
                              <div className="text-[10px] text-text-secondary line-clamp-1">
                                {prod.description}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase">
                                {catName}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-primary">
                              KD {prod.price.toFixed(3)}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${prod.stock > 0 ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                              >
                                {prod.stock} left
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 rounded bg-bg text-text-secondary hover:text-primary hover:bg-surface border border-border transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod._id)}
                                  className="p-1.5 rounded bg-error/10 text-error hover:bg-error hover:text-white transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text">Meal Categories</h2>
              <button
                onClick={handleOpenCreateCategory}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Category
              </button>
            </div>

            {catLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No categories found</p>
                <button
                  onClick={handleOpenCreateCategory}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <img
                        src={
                          cat.image?.secure_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={cat.name}
                        className="w-full h-32 rounded-lg object-cover bg-bg border border-border"
                      />
                      <h3 className="text-sm font-extrabold text-text capitalize">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {cat.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="flex-1 py-1.5 rounded bg-bg text-text-secondary hover:text-primary hover:bg-surface border border-border text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat._id)}
                        className="py-1.5 px-3 rounded bg-error/10 text-error hover:bg-error hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-text">Customer Orders</h2>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-semibold">
                  Filter:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-text focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchOrders}
                  className="p-1.5 rounded-lg bg-bg border border-border text-text-secondary hover:text-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {orderLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const u = ord.userId || {};
                  return (
                    <div
                      key={ord._id}
                      className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text">
                              Order #{ord._id.slice(-8).toUpperCase()}
                            </span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                ord.status === "delivered"
                                  ? "bg-success/10 text-success"
                                  : ord.status === "cancelled"
                                    ? "bg-error/10 text-error"
                                    : "bg-primary/10 text-primary"
                              }`}
                            >
                              {ord.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Customer:{" "}
                            <span className="font-semibold text-text">
                              {u.firstName} {u.lastName}
                            </span>{" "}
                            ({u.email})
                          </p>
                          <p className="text-xs text-text-secondary">
                            Placed: {new Date(ord.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Update Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-secondary">
                            Status:
                          </span>
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(ord._id, e.target.value)
                            }
                            disabled={
                              ord.status === "delivered" ||
                              ord.status === "cancelled"
                            }
                            className="px-3 py-1.5 rounded-lg bg-bg border border-border text-xs font-bold text-text focus:outline-none focus:border-primary disabled:opacity-60"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Items & Delivery Details */}
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="font-bold text-primary uppercase tracking-wider mb-1.5">
                            Items
                          </h4>
                          <div className="space-y-1 text-text-secondary">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.name}
                                </span>
                                <span className="font-semibold text-text">
                                  KD {(it.price * it.quantity).toFixed(3)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 text-text-secondary">
                          <h4 className="font-bold text-primary uppercase tracking-wider mb-1.5">
                            Delivery Info
                          </h4>
                          <p>
                            <strong className="text-text">Phone:</strong>{" "}
                            {ord.phone}
                          </p>
                          <p>
                            <strong className="text-text">Address:</strong>{" "}
                            {ord.address}
                          </p>
                          {ord.note && (
                            <p>
                              <strong className="text-text">Note:</strong>{" "}
                              {ord.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border space-y-1.5 text-sm font-extrabold text-text">
                        {ord.couponCode && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-text-secondary">Coupon Applied</span>
                            <span className="inline-flex items-center gap-1.5 text-success font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {ord.couponCode}
                              {ord.discountAmount > 0 && (
                                <span>-KD {ord.discountAmount.toFixed(3)}</span>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span>Total Price</span>
                          <span className="text-primary text-base">
                            KD {ord.totalPrice?.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OFFERS MANAGEMENT */}
        {activeTab === "offers" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text">Promotions & Offers</h2>
              <button
                onClick={handleOpenCreateOffer}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Offer
              </button>
            </div>

            {offerLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : offers.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No offers found</p>
                <button
                  onClick={handleOpenCreateOffer}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Create your first offer
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer) => (
                  <div
                    key={offer._id}
                    className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col"
                  >
                    <img
                      src={offer.image?.secure_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"}
                      alt={offer.title}
                      className="w-full h-32 object-cover bg-bg border-b border-border"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {offer.tag || "SPECIAL OFFER"}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              offer.active
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {offer.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-text">{offer.title}</h3>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {offer.description || "No description provided."}
                        </p>
                        {offer.promoCode && (
                          <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-widest">
                            {offer.promoCode}
                          </span>
                        )}
                        {offer.discountPercent > 0 && (
                          <span className="inline-block px-2 py-0.5 rounded bg-warning/10 text-warning text-[10px] font-bold ml-1">
                            {offer.discountPercent}% OFF
                          </span>
                        )}
                        {(offer.startDate || offer.endDate) && (
                          <div className="text-[10px] text-text-secondary space-y-0.5 pt-1">
                            {offer.startDate && (
                              <p>Starts: {new Date(offer.startDate).toLocaleDateString()}</p>
                            )}
                            {offer.endDate && (
                              <p>Ends: {new Date(offer.endDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => handleOpenEditOffer(offer)}
                          className="flex-1 py-1.5 rounded bg-bg text-text-secondary hover:text-primary hover:bg-surface border border-border text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer._id)}
                          className="py-1.5 px-3 rounded bg-error/10 text-error hover:bg-error hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: COUPONS MANAGEMENT */}
        {activeTab === "coupons" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text">Discount Coupons</h2>
              <button
                onClick={handleOpenCreateCoupon}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Coupon
              </button>
            </div>

            {couponLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <Ticket className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No coupons found</p>
                <button
                  onClick={handleOpenCreateCoupon}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Create your first coupon
                </button>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-border text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Discount</th>
                        <th className="py-3 px-4">Min Order</th>
                        <th className="py-3 px-4">Expiry</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs text-text">
                      {coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-bg/50 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-primary tracking-widest">
                            {coupon.code}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {coupon.discountType === "percent"
                              ? `${coupon.discountValue}%`
                              : `KD ${coupon.discountValue.toFixed(3)}`}
                          </td>
                          <td className="py-3 px-4">KD {coupon.minOrder?.toFixed(3)}</td>
                          <td className="py-3 px-4">
                            {coupon.expiryDate
                              ? new Date(coupon.expiryDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                coupon.active
                                  ? "bg-success/10 text-success"
                                  : "bg-error/10 text-error"
                              }`}
                            >
                              {coupon.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditCoupon(coupon)}
                                className="p-1.5 rounded bg-bg text-text-secondary hover:text-primary hover:bg-surface border border-border transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="p-1.5 rounded bg-error/10 text-error hover:bg-error hover:text-white transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ADDONS MANAGEMENT */}
        {activeTab === "addons" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text">Add-ons</h2>
              <button
                onClick={handleOpenCreateAddon}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Addon
              </button>
            </div>

            {addonLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : addons.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-secondary">
                <Puzzle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No addons found</p>
                <button
                  onClick={handleOpenCreateAddon}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Create your first addon
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {addons.map((addon) => (
                  <div
                    key={addon._id}
                    className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <img
                        src={
                          addon.image?.secure_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                        }
                        alt={addon.name}
                        className="w-full h-32 rounded-lg object-cover bg-bg border border-border"
                      />
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-text">
                          {addon.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            addon.isActive
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {addon.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {addon.description || "No description provided."}
                      </p>
                      <p className="text-sm font-extrabold text-primary">
                        KD {(addon.price || 0).toFixed(3)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleOpenEditAddon(addon)}
                        className="flex-1 py-1.5 rounded bg-bg text-text-secondary hover:text-primary hover:bg-surface border border-border text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon._id)}
                        className="py-1.5 px-3 rounded bg-error/10 text-error hover:bg-error hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL (CATEGORY / PRODUCT / OFFER / COUPON / ADDON CREATE & EDIT) */}
        {modalType && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-lg font-bold text-text">
                  {modalType === "createCategory" && "Create Category"}
                  {modalType === "editCategory" && "Edit Category"}
                  {modalType === "createProduct" && "Create Product"}
                  {modalType === "editProduct" && "Edit Product"}
                  {modalType === "createOffer" && "Create Offer"}
                  {modalType === "editOffer" && "Edit Offer"}
                  {modalType === "createCoupon" && "Create Coupon"}
                  {modalType === "editCoupon" && "Edit Coupon"}
                  {modalType === "createAddon" && "Create Add-on"}
                  {modalType === "editAddon" && "Edit Add-on"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-lg text-text-secondary hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-error/10 text-error text-xs font-semibold px-4 py-2.5 rounded-lg border border-error/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={
                  modalType.includes("Category")
                    ? handleSubmitCategory
                    : modalType.includes("Product")
                      ? handleSubmitProduct
                      : modalType.includes("Offer")
                        ? handleSubmitOffer
                        : modalType.includes("Addon")
                          ? handleSubmitAddon
                          : handleSubmitCoupon
                }
                className="space-y-4 text-xs"
              >
                {/* CATEGORY / PRODUCT / ADDON FIELDS */}
                {(modalType.includes("Category") || modalType.includes("Product") || modalType.includes("Addon")) && (
                  <>
                    {/* Name */}
                    <div>
                      <label className="block font-semibold text-text mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter name"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block font-semibold text-text mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Enter description"
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {/* OFFER SPECIFIC FIELDS */}
                {modalType.includes("Offer") && (
                  <>
                    <div>
                      <label className="block font-semibold text-text mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Get 20% Off Your First Order"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text mb-1">Description *</label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the offer"
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Promo Code</label>
                        <input
                          type="text"
                          value={formData.promoCode || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, promoCode: e.target.value }))}
                          placeholder="ROCK20"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary font-bold tracking-widest"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountPercent ?? ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountPercent: e.target.value }))}
                          placeholder="10"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Tag</label>
                        <input
                          type="text"
                          value={formData.tag || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                          placeholder="SPECIAL OFFER"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Status</label>
                        <select
                          value={formData.active ? "true" : "false"}
                          onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">End Date</label>
                        <input
                          type="date"
                          value={formData.endDate || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Select Products for Offer */}
                    <div>
                      <label className="block font-semibold text-text mb-1">
                        Included Products
                        <span className="text-text-secondary font-normal ml-1">
                          ({formData.products?.length || 0} selected)
                        </span>
                      </label>
                      {products.length === 0 ? (
                        <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-3 py-2.5">
                          No products available. Create products first.
                        </p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto bg-bg border border-border rounded-lg divide-y divide-border">
                          {products.map((prod) => {
                            const isSelected = (formData.products || []).includes(prod._id);
                            return (
                              <label
                                key={prod._id}
                                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                                  isSelected ? "bg-primary/5" : "hover:bg-surface"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleOfferProduct(prod._id)}
                                  className="w-3.5 h-3.5 accent-primary"
                                />
                                <img
                                  src={prod.image?.secure_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=50&q=80"}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded object-cover border border-border bg-surface"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-text truncate">{prod.name}</p>
                                  <p className="text-[10px] text-text-secondary">KD {prod.price?.toFixed(3)}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* COUPON SPECIFIC FIELDS */}
                {modalType.includes("Coupon") && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Code *</label>
                        <input
                          type="text"
                          value={formData.code || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          placeholder="SAVE10"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary font-bold tracking-widest"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Type</label>
                        <select
                          value={formData.discountType || "percent"}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountType: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        >
                          {COUPON_DISCOUNT_TYPES.map((t) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Value *</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.discountValue ?? ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: e.target.value }))}
                          placeholder={formData.discountType === "percent" ? "10" : "5.00"}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Min Order (KD)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.minOrder ?? ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, minOrder: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Max Discount (KD)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.maxDiscount ?? ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                          placeholder="Optional"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Expiry Date *</label>
                        <input
                          type="date"
                          value={formData.expiryDate || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Usage Limit</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.usageLimit ?? ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                          placeholder="Unlimited"
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Per User</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.perUserLimit ?? 1}
                          onChange={(e) => setFormData((prev) => ({ ...prev, perUserLimit: e.target.value }))}
                          placeholder="1"
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Status</label>
                        <select
                          value={formData.active ? "true" : "false"}
                          onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))}
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* PRODUCT SPECIFIC FIELDS */}
                {modalType.includes("Product") && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">
                          Price (KD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          placeholder="15.99"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">
                          Stock *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              stock: e.target.value,
                            }))
                          }
                          placeholder="50"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-semibold text-protein mb-1">
                          Protein (g) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.protein ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              protein: e.target.value,
                            }))
                          }
                          placeholder="25"
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-carbs mb-1">
                          Carbs (g) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.carbs ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              carbs: e.target.value,
                            }))
                          }
                          placeholder="30"
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-fat mb-1">
                          Fats (g) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.fats ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              fats: e.target.value,
                            }))
                          }
                          placeholder="15"
                          className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-text mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.categoryId || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            categoryId: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        required
                      >
                        <option value="" disabled>
                          Select a category
                        </option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* ADDON SPECIFIC FIELDS */}
                {modalType.includes("Addon") && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">
                          Price (KD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          placeholder="1.500"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">
                          Status
                        </label>
                        <select
                          value={formData.isActive ? "true" : "false"}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.value === "true",
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Image Upload (not for coupons) */}
                {!modalType.includes("Coupon") && (
                  <div>
                    <label className="block font-semibold text-text mb-1">
                      Image Upload
                    </label>
                    <div className="flex items-center gap-3">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-border bg-bg"
                        />
                      )}
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-bg border border-dashed border-border hover:border-primary text-text-secondary hover:text-primary transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>
                          {imageFile ? imageFile.name : "Choose image..."}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-border text-text font-semibold hover:bg-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
