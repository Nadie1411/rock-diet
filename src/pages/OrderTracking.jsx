import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Check,
  Clock,
  ChefHat,
  Truck,
  PackageCheck,
  XCircle,
  MapPin,
  Phone,
  ArrowLeft,
} from 'lucide-react';

import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * Where one order has got to.
 *
 * The stages are the server's own — pending, confirmed, on the way,
 * delivered — shown as a line the order moves down rather than a single word,
 * because "confirmed" on its own doesn't tell anyone what happens next.
 *
 * A cancelled order leaves that line entirely, so it is drawn as its own
 * state instead of a step nobody reaches.
 */

const STAGES = [
  {
    key: 'pending',
    labelKey: 'checkoutOrderPlaced',
    hintKey: 'weHaveYourOrder',
    Icon: Clock,
  },
  {
    key: 'confirmed',
    labelKey: 'inTheKitchen',
    hintKey: 'mealsBeingPrepared',
    Icon: ChefHat,
  },
  {
    key: 'on_the_way',
    labelKey: 'statusOnTheWay',
    hintKey: 'driverOnWay',
    Icon: Truck,
  },
  {
    key: 'delivered',
    labelKey: 'statusDelivered',
    hintKey: 'enjoyMeals',
    Icon: PackageCheck,
  },
];

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

export default function OrderTracking() {
  const { t, L } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    let mounted = true;

    const fetch = () =>
      orderService
        .getOrderById(id)
        .then((res) => {
          if (mounted) setOrder(res.data?.order ?? res.data);
        })
        .catch((err) => {
          if (mounted) setError(err?.message || 'Could not load this order.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

    fetch();

    // An order in flight changes without the customer doing anything, so the
    // page keeps up rather than showing a stage that has already passed.
    const timer = setInterval(fetch, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, id]);

  // Session first. Only once we know they are a guest can the ask be
  // shown - and it must come before any data gate, because the data these
  // pages load is exactly what a guest never fetches, so `loading` would
  // stay true forever and leave them on a spinner that never resolves.
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <SignInPrompt reason={t('authGateOrders')} />;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-8 h-8 mx-auto text-error mb-3" />
          <p className="font-bold">{error || 'Order not found'}</p>
          <Link
            to="/orders"
            className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
          >{t('backToOrders')}</Link>
        </div>
      </div>
    );
  }

  const cancelled = order.status === 'cancelled';
  const currentIndex = STAGES.findIndex((s) => s.key === order.status);
  const items = order.items || order.products || [];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5"
        >
          <ArrowLeft className="w-4 h-4" />{t('allOrders')}</Link>

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold">
            Order #{String(order._id || '').slice(-6).toUpperCase()}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </header>

        {cancelled ? (
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-error/10 border border-error/20 mb-6">
            <XCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm">{t('orderWasCancelled')}</p>
              <p className="text-xs text-text-secondary mt-0.5">{t('cancelledExplain')}</p>
            </div>
          </div>
        ) : (
          <ol className="rounded-2xl border border-border bg-surface p-5 mb-6">
            {STAGES.map((stage, i) => {
              const done = currentIndex >= 0 && i < currentIndex;
              const current = i === currentIndex;
              const { Icon } = stage;
              return (
                <li key={stage.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        done
                          ? 'bg-success text-white'
                          : current
                            ? 'bg-primary text-on-primary border border-transparent'
                            : 'bg-bg text-text-secondary border border-border'
                      }`}
                    >
                      {done ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 my-1 rounded ${
                          done ? 'bg-success' : 'bg-border'
                        }`}
                        style={{ minHeight: 28 }}
                      />
                    )}
                  </div>
                  <div className={`pb-6 ${i === STAGES.length - 1 ? 'pb-0' : ''}`}>
                    <p
                      className={`text-sm font-bold ${
                        current ? 'text-primary' : done ? 'text-text' : 'text-text-secondary'
                      }`}
                    >
                      {t(stage.labelKey)}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t(stage.hintKey)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="rounded-2xl border border-border bg-surface overflow-hidden mb-6">
          <h2 className="px-5 py-3 border-b border-border font-bold text-sm">{t('whatsInIt')}</h2>
          <ul className="divide-y divide-border">
            {items.map((item, i) => {
              const p = item.productId || item.product || item;
              return (
                <li key={p?._id || i} className="flex items-center gap-3 px-5 py-3">
                  {p?.image?.secure_url && (
                    <img
                      src={p.image.secure_url}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {L(p?.name) || 'Meal'}
                    </p>
                  </div>
                  {item.quantity > 1 && (
                    <span className="text-xs font-bold text-text-secondary shrink-0">
                      ×{item.quantity}
                    </span>
                  )}
                  <span className="text-sm font-semibold shrink-0">
                    {kd(item.price ?? p?.price)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between px-5 py-4 bg-primary/5 border-t border-border">
            <span className="font-bold text-sm">{t('cartTotal')}</span>
            <span className="text-lg font-extrabold tabular-nums">
              {kd(order.totalPrice ?? order.total)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 text-sm">
          {order.address && (
            <p className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-text-secondary" />
              <span>{order.address}</span>
            </p>
          )}
          {order.phone && (
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 shrink-0 text-text-secondary" />
              <span>{order.phone}</span>
            </p>
          )}
          {order.note && (
            <p className="text-text-secondary text-xs pt-1">
              Note: {order.note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
