import React, { useState } from 'react';
import { Package, Clock, CheckCircle2, Truck, RefreshCw, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTIVE_ORDERS = [
  {
    id: 'ORD-8924',
    date: 'Today, 8:15 PM',
    status: 'Out for Delivery',
    step: 3,
    eta: '12-15 mins',
    driver: 'Alex Rivera (Honda Civic - Red)',
    deliveryAddress: '742 Evergreen Terrace, Apt 4B',
    items: [
      { name: 'Grilled Chicken Protein Plate', qty: 2, price: 33.98 },
      { name: 'Cold-Pressed Green Juice', qty: 2, price: 15.00 },
    ],
    total: 52.98,
  },
];

const PAST_ORDERS = [
  {
    id: 'ORD-7612',
    date: 'Yesterday, 1:30 PM',
    status: 'Delivered',
    step: 4,
    deliveryAddress: '742 Evergreen Terrace, Apt 4B',
    items: [
      { name: 'Wild Salmon Power Bowl', qty: 1, price: 19.50 },
      { name: 'Green Detox Smoothie Bowl', qty: 1, price: 10.50 },
    ],
    total: 33.50,
  },
  {
    id: 'ORD-6109',
    date: 'Aug 4, 2026, 7:45 PM',
    status: 'Delivered',
    step: 4,
    deliveryAddress: '742 Evergreen Terrace, Apt 4B',
    items: [
      { name: 'Keto Steak & Cauliflower Mash', qty: 2, price: 45.00 },
      { name: 'Avocado & Quinoa Power Bowl', qty: 1, price: 14.50 },
    ],
    total: 63.20,
  },
];

export default function Orders() {
  const [activeTab, setActiveTab] = useState('active');

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
              Active ({ACTIVE_ORDERS.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'past'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              History ({PAST_ORDERS.length})
            </button>
          </div>
        </div>

        {/* Active Orders */}
        {activeTab === 'active' ? (
          <div className="space-y-5">
            {ACTIVE_ORDERS.map((order) => (
              <div
                key={order.id}
                className="bg-bg border border-border rounded-xl p-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text">{order.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-primary font-semibold border border-border">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{order.date}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-text-secondary">Estimated Arrival</span>
                    <p className="text-lg font-bold text-primary flex items-center gap-1 sm:justify-end">
                      <Clock className="w-4 h-4" /> {order.eta}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="py-6 border-b border-border">
                  <p className="text-xs font-semibold text-text-secondary mb-4">Delivery Status</p>
                  <div className="grid grid-cols-4 gap-2 text-center relative">
                    <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-surface -z-0">
                      <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
                    </div>

                    {[
                      { step: 1, label: 'Confirmed', icon: CheckCircle2 },
                      { step: 2, label: 'Preparing', icon: Clock },
                      { step: 3, label: 'On The Way', icon: Truck },
                      { step: 4, label: 'Delivered', icon: Package },
                    ].map((st) => {
                      const Icon = st.icon;
                      const isCurrent = order.step === st.step;
                      const isDone = order.step >= st.step;
                      return (
                        <div key={st.step} className="flex flex-col items-center z-10">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-primary text-white ring-4 ring-border scale-110 shadow-md'
                                : isDone
                                ? 'bg-primary text-white'
                                : 'bg-surface text-text-secondary border border-border'
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
                <div className="py-4 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Order Items</h4>
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-text-secondary">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-semibold text-text">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Courier</h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-primary" /> {order.driver}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Address</h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-text-secondary">Total Paid</span>
                  <span className="text-xl font-extrabold text-text">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Past Orders */
          <div className="space-y-4">
            {PAST_ORDERS.map((order) => (
              <div
                key={order.id}
                className="bg-bg border border-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text text-sm">{order.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold border border-success/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                    <span className="text-xs text-text-secondary">{order.date}</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {order.items.map((it) => `${it.qty}x ${it.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  <span className="text-lg font-bold text-text">${order.total.toFixed(2)}</span>
                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
