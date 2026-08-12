import React, { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle2, Truck, RefreshCw, MapPin, Loader2, AlertCircle, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

const STATUS_STEPS = {
  pending: 1,
  confirmed: 2,
  on_the_way: 3,
  delivered: 4,
};

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getUserOrders();
      setOrders(res.data || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to fetch your orders.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg text-text py-20">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-text">Please Login to View Orders</h1>
          <p className="text-xs text-text-secondary">Track your active healthy meal deliveries and order history.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-md"
          >
            Login to Your Account
          </button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ['pending', 'confirmed', 'on_the_way'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) return;
    setCancelingId(orderId);
    setError('');
    try {
      await orderService.cancelOrder(orderId);
      setSuccessMsg('Order cancelled successfully.');
      fetchOrders();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">
              Your <span className="text-primary">Orders</span>
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-1">
              Track live deliveries or review past order receipts.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-border shadow-sm">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              Active ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'past'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              History ({pastOrders.length})
            </button>
          </div>
        </div>

        {/* Banners */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 bg-success/10 text-success text-xs font-semibold px-4 py-3 rounded-lg border border-success/30">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-text-secondary">Loading your orders...</p>
          </div>
        ) : activeTab === 'active' ? (
          /* Active Orders */
          <div className="space-y-5">
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-border">
                <Package className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-text">No active orders right now</p>
                <p className="text-xs text-text-secondary mt-1">Ready for a healthy meal? Explore our menu!</p>
                <Link
                  to="/menu"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
                >
                  Browse Menu
                </Link>
              </div>
            ) : (
              activeOrders.map((order) => {
                const step = STATUS_STEPS[order.status] || 1;
                return (
                  <div
                    key={order._id}
                    className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text">#{order._id.slice(-8).toUpperCase()}</span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancelingId === order._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white text-xs font-semibold transition-colors disabled:opacity-60"
                        >
                          {cancelingId === order._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Cancel Order</span>
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="py-4 border-b border-border">
                      <p className="text-xs font-semibold text-text-secondary mb-4">Delivery Progress</p>
                      <div className="grid grid-cols-4 gap-2 text-center relative">
                        <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-bg -z-0">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                          />
                        </div>

                        {[
                          { stepNum: 1, label: 'Confirmed', icon: CheckCircle2 },
                          { stepNum: 2, label: 'Preparing', icon: Clock },
                          { stepNum: 3, label: 'On The Way', icon: Truck },
                          { stepNum: 4, label: 'Delivered', icon: Package },
                        ].map((st) => {
                          const Icon = st.icon;
                          const isCurrent = step === st.stepNum;
                          const isDone = step >= st.stepNum;
                          return (
                            <div key={st.stepNum} className="flex flex-col items-center z-10">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-md'
                                    : isDone
                                    ? 'bg-primary text-white'
                                    : 'bg-bg text-text-secondary border border-border'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`text-[11px] mt-2 font-medium ${isDone ? 'text-primary' : 'text-text-secondary'}`}>
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="py-2 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Order Items</h4>
                        <div className="space-y-1.5 text-xs text-text-secondary">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-semibold text-text">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <h4 className="font-bold text-primary uppercase tracking-wider mb-1">Delivery Address</h4>
                        <p className="text-text-secondary flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{order.address}</span>
                        </p>
                        <p className="text-text-secondary">Phone: {order.phone}</p>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Total Amount</span>
                      <span className="text-xl font-extrabold text-text">${order.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Past Orders */
          <div className="space-y-4">
            {pastOrders.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-xl border border-border">
                <Package className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-text">No order history yet</p>
              </div>
            ) : (
              pastOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text text-sm">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                        order.status === 'delivered' ? 'bg-success/10 text-success border border-success/30' : 'bg-error/10 text-error border border-error/30'
                      }`}>
                        {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {order.status}
                      </span>
                      <span className="text-xs text-text-secondary">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {order.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <span className="text-lg font-extrabold text-text">${order.totalPrice?.toFixed(2)}</span>
                    <Link
                      to="/menu"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
