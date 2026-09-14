import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Bell, CheckCheck, Package, CreditCard, Info } from 'lucide-react';

import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * The notification feed.
 *
 * The feed is the durable record — push is only the tap on the shoulder — so
 * this shows everything the server has written, whether or not a push ever
 * reached the device.
 */

const ICONS = {
  order: Package,
  payment: CreditCard,
  general: Info,
};

const relative = (iso) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function Notifications() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);


  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService
      .getNotifications({ limit: 50 })
      .then((res) => {
        // `{ notifications, unread }` from this backend; tolerant of a bare
        // array so the page survives either shape.
        const data = res.data;
        setItems(
          Array.isArray(data) ? data : (data?.notifications ?? data?.items ?? []),
        );
      })
      .catch((err) => setError(err?.message || 'Could not load notifications.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const markOne = async (id) => {
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    try {
      await notificationService.markAsRead(id);
    } catch {
      // The feed is still readable if the flag doesn't stick; leaving the
      // optimistic state is kinder than flicking it back under the cursor.
    }
  };

  const markAll = async () => {
    setMarking(true);
    try {
      await notificationService.markAllAsRead();
      setItems((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      );
    } catch (err) {
      setError(err?.message || 'Could not mark them read.');
    } finally {
      setMarking(false);
    }
  };

  const unread = items.filter((n) => !n.readAt).length;

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

  if (!isAuthenticated) return <SignInPrompt reason={t('authGateGeneric')} />;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-extrabold">
            Notifications
            {unread > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-on-primary text-xs align-middle">
                {unread}
              </span>
            )}
          </h1>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={marking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:border-primary transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />{t('notifMarkAllRead')}</button>
          )}
        </div>

        {error && (
          <div className="p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">{error}</div>
        )}

        {!items.length ? (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 mx-auto text-text-secondary/40 mb-3" />
            <p className="font-bold">{t('nothingYet')}</p>
            <p className="text-sm text-text-secondary mt-1">{t('orderUpdatesHere')}</p>
            <Link
              to="/menu"
              className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
            >{t('guestBrowse')}</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const Icon = ICONS[n.type] || Info;
              const isUnread = !n.readAt;
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isUnread) markOne(n._id);
                      if (n.orderId) navigate('/orders');
                    }}
                    className={`w-full text-left flex gap-3 p-4 rounded-2xl border transition-colors ${
                      isUnread
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-surface'
                    } hover:border-primary/50`}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnread ? 'bg-primary text-on-primary' : 'bg-bg text-text-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-bold text-sm truncate">
                          {L(n.title)}
                        </span>
                        <span className="text-[11px] text-text-secondary shrink-0">
                          {relative(n.createdAt)}
                        </span>
                      </span>
                      <span className="block text-sm text-text-secondary mt-0.5">
                        {L(n.body)}
                      </span>
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
