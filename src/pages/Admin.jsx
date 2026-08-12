import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { ApiError } from '../services/api';

const ORDER_STATUSES = ['pending', 'confirmed', 'on_the_way', 'delivered', 'cancelled'];

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('products'); // 'categories' | 'products' | 'orders'

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & forms
  const [modalType, setModalType] = useState(null); // 'createCategory' | 'editCategory' | 'createProduct' | 'editProduct'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data || []);
    } catch {
      setError('Failed to fetch categories.');
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
      setError('Failed to fetch products.');
    } finally {
      setProdLoading(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setOrderLoading(true);
    try {
      const res = await orderService.getAllOrders({ status: statusFilter || undefined, limit: 50 });
      setOrders(res.data || []);
    } catch {
      setError('Failed to fetch admin orders.');
    } finally {
      setOrderLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchProducts();
      fetchOrders();
    }
  }, [isAdmin, fetchCategories, fetchProducts, fetchOrders]);

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
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
    setImageFile(null);
    setImagePreview(null);
    setError('');
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
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setModalType('createCategory');
  };

  const handleOpenEditCategory = (cat) => {
    setSelectedItem(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setImageFile(null);
    setImagePreview(cat.image?.secure_url || null);
    setError('');
    setModalType('editCategory');
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.name) data.append('name', formData.name.trim());
      if (formData.description !== undefined) data.append('description', formData.description.trim());
      if (imageFile) data.append('image', imageFile);

      if (modalType === 'createCategory') {
        await categoryService.createCategory(data);
        setSuccess('Category created successfully!');
      } else {
        await categoryService.updateCategory(selectedItem._id, data);
        setSuccess('Category updated successfully!');
      }

      closeModal();
      fetchCategories();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || 'Action failed.');
        }
      } else {
        setError('Network error.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryService.deleteCategory(catId);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    }
  };

  // PRODUCT ACTIONS
  const handleOpenCreateProduct = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: categories[0]?._id || '',
    });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setModalType('createProduct');
  };

  const handleOpenEditProduct = (prod) => {
    setSelectedItem(prod);
    const catId = typeof prod.categoryId === 'object' ? prod.categoryId?._id : prod.categoryId;
    setFormData({
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      stock: prod.stock,
      categoryId: catId || '',
    });
    setImageFile(null);
    setImagePreview(prod.image?.secure_url || null);
    setError('');
    setModalType('editProduct');
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      if (formData.name) data.append('name', formData.name.trim());
      if (formData.description) data.append('description', formData.description.trim());
      if (formData.price !== undefined) data.append('price', Number(formData.price));
      if (formData.stock !== undefined) data.append('stock', Number(formData.stock));
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (imageFile) data.append('image', imageFile);

      if (modalType === 'createProduct') {
        await productService.createProduct(data);
        setSuccess('Product created successfully!');
      } else {
        await productService.updateProduct(selectedItem._id, data);
        setSuccess('Product updated successfully!');
      }

      closeModal();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.error?.length) {
          setError(err.data.error[0].message);
        } else {
          setError(err.message || 'Action failed.');
        }
      } else {
        setError('Network error.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.deleteProduct(prodId);
      setSuccess('Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  // ORDER STATUS UPDATE
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order status updated to ${newStatus}!`);
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
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
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Package className="w-4 h-4" />
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <Layers className="w-4 h-4" />
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Orders ({orders.length})
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
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-between bg-success/10 text-success text-xs font-semibold px-4 py-3 rounded-lg border border-success/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
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
                        const catName = typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'Uncategorized';
                        return (
                          <tr key={prod._id} className="hover:bg-bg/50 transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={prod.image?.secure_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover bg-bg border border-border"
                              />
                            </td>
                            <td className="py-3 px-4 font-bold text-text">
                              <div>{prod.name}</div>
                              <div className="text-[10px] text-text-secondary line-clamp-1">{prod.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase">
                                {catName}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-primary">${prod.price.toFixed(2)}</td>
                            <td className="py-3 px-4 font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${prod.stock > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
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
        {activeTab === 'categories' && (
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
                  <div key={cat._id} className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <img
                        src={cat.image?.secure_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                        alt={cat.name}
                        className="w-full h-32 rounded-lg object-cover bg-bg border border-border"
                      />
                      <h3 className="text-sm font-extrabold text-text capitalize">{cat.name}</h3>
                      <p className="text-xs text-text-secondary line-clamp-2">{cat.description || 'No description provided.'}</p>
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
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-text">Customer Orders</h2>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-semibold">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-text focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
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
                    <div key={ord._id} className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text">Order #{ord._id.slice(-8).toUpperCase()}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              ord.status === 'delivered' ? 'bg-success/10 text-success' :
                              ord.status === 'cancelled' ? 'bg-error/10 text-error' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Customer: <span className="font-semibold text-text">{u.firstName} {u.lastName}</span> ({u.email})
                          </p>
                          <p className="text-xs text-text-secondary">
                            Placed: {new Date(ord.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Update Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-secondary">Status:</span>
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                            disabled={ord.status === 'delivered' || ord.status === 'cancelled'}
                            className="px-3 py-1.5 rounded-lg bg-bg border border-border text-xs font-bold text-text focus:outline-none focus:border-primary disabled:opacity-60"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Items & Delivery Details */}
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="font-bold text-primary uppercase tracking-wider mb-1.5">Items</h4>
                          <div className="space-y-1 text-text-secondary">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{it.quantity}x {it.name}</span>
                                <span className="font-semibold text-text">${(it.price * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 text-text-secondary">
                          <h4 className="font-bold text-primary uppercase tracking-wider mb-1.5">Delivery Info</h4>
                          <p><strong className="text-text">Phone:</strong> {ord.phone}</p>
                          <p><strong className="text-text">Address:</strong> {ord.address}</p>
                          {ord.note && <p><strong className="text-text">Note:</strong> {ord.note}</p>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex justify-between items-center text-sm font-extrabold text-text">
                        <span>Total Price</span>
                        <span className="text-primary text-base">${ord.totalPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL (CATEGORY / PRODUCT CREATE & EDIT) */}
        {modalType && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-lg font-bold text-text">
                  {modalType === 'createCategory' && 'Create Category'}
                  {modalType === 'editCategory' && 'Edit Category'}
                  {modalType === 'createProduct' && 'Create Product'}
                  {modalType === 'editProduct' && 'Edit Product'}
                </h3>
                <button onClick={closeModal} className="p-1 rounded-lg text-text-secondary hover:text-text">
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
                  modalType.includes('Category') ? handleSubmitCategory : handleSubmitProduct
                }
                className="space-y-4 text-xs"
              >
                {/* Name */}
                <div>
                  <label className="block font-semibold text-text mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-text mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* PRODUCT SPECIFIC FIELDS */}
                {modalType.includes('Product') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-text mb-1">Price ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price ?? ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                          placeholder="15.99"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-text mb-1">Stock *</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stock ?? ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                          placeholder="50"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-text mb-1">Category *</label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text focus:outline-none focus:border-primary font-semibold"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block font-semibold text-text mb-1">Image Upload</label>
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
                      <span>{imageFile ? imageFile.name : 'Choose image...'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

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
                      'Save Changes'
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
