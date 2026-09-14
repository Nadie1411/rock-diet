import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Tag, ArrowRight, AlertCircle, Check } from 'lucide-react';

import { offerService } from '../services/offerService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGate';
import { useT } from '../i18n/useT';

/** Bundles the kitchen is running, and what they take off the price. */
export default function Offers() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { addOfferToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState('');
  const [added, setAdded] = useState('');
  const [orderError, setOrderError] = useState('');


  /**
   * Buys the bundle, which is what the line above the button promises.
   *
   * This was a link to /menu — so the only way to get a bundle was to find
   * its dishes and add them one at a time, at full price, losing the discount
   * the offer exists to give.
   */
  const orderBundle = async (offer) => {
    if (!requireAuth(() => orderBundle(offer), { reason: t('authGateOffer') })) return;
    setOrdering(offer._id);
    setOrderError('');
    try {
      await addOfferToCart(offer._id);
      setAdded(offer._id);
      setTimeout(() => setAdded(''), 2500);
    } catch (err) {
      setOrderError(err?.message || t('cartAddOfferFailed'));
    } finally {
      setOrdering('');
    }
  };
  const [error, setError] = useState('');

  useEffect(() => {
    offerService
      .getOffers({ active: true })
      .then((res) => setOffers(res.data || []))
      .catch((err) => setError(err?.message || 'Could not load offers.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">{t('offersTitle')}</h1>
          <p className="text-text-secondary mt-2">{t('offersSubtitle')}</p>
        </header>

        {error && (
          <div className="p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">{error}</div>
        )}

        {!offers.length ? (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 mx-auto text-text-secondary/40 mb-3" />
            <p className="font-bold">{t('noOffers')}</p>
            <Link
              to="/menu"
              className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold"
            >{t('guestBrowse')}</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orderError && (
              <div className="mb-6 flex items-start gap-2 p-4 rounded-xl bg-error/10 text-error text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* The one saving worth pointing at. Recomputed from the list
                rather than stored, so it stays true as offers come and go. */}
            {offers.map((offer) => (
              <article
                key={offer._id}
                className="rounded-2xl border border-border bg-surface overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {offer.tag && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-bold uppercase tracking-wide mb-2">
                          {L(offer.tag)}
                        </span>
                      )}
                      <h2 className="text-lg font-extrabold truncate">
                        {L(offer.title)}
                      </h2>
                      {L(offer.description) && (
                        <p className="text-sm text-text-secondary mt-2">
                          {L(offer.description)}
                        </p>
                      )}
                    </div>
                    {offer.discountPercent > 0 && (
                      <span className="shrink-0 px-3 py-2 rounded-xl bg-success/10 text-success text-center">
                        <span className="block text-lg font-extrabold leading-none">
                          {offer.discountPercent}%
                        </span>
                        <span className="block text-[10px] font-bold uppercase">
                          {t('off')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {Boolean(offer.products?.length) && (
                  <div className="px-5 pb-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">{t('included')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {offer.products.map((p) => (
                        <Link
                          key={p._id}
                          to={`/menu/${p._id}`}
                          className="rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors"
                        >
                          {p.image?.secure_url && (
                            <img
                              src={p.image.secure_url}
                              alt={L(p.name)}
                              className="w-full h-20 object-cover"
                            />
                          )}
                          <span className="block p-2">
                            <span className="block text-xs font-semibold truncate">
                              {L(p.name)}
                            </span>
                            <span className="block text-xs text-text-secondary">
                              KD {Number(p.price || 0).toFixed(3)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-5 py-4 bg-primary/5 border-t border-border">
                  <span className="text-xs text-text-secondary">{t('addedAsBundle')}</span>
                  <button
                    type="button"
                    onClick={() => orderBundle(offer)}
                    disabled={ordering === offer._id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {ordering === offer._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : added === offer._id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    )}
                    {added === offer._id ? t('commonAdded') : t('orderNow')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
