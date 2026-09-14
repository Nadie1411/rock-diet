import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';
import AddressPicker from '../components/AddressPicker';
import {
  defaultAddress,
  format as formatAddress,
  hydrateFromAccount,
  listAddresses,
} from '../utils/addressBook';

/**
 * Where a subscription's daily boxes go.
 *
 * Held on the account rather than on an order, because a subscription
 * delivers without anyone placing an order — there is no checkout to collect
 * an address at. One-off baskets still carry their own.
 *
 * Uses the same address book as checkout, so a customer keeps one list rather
 * than two that can disagree. What the account stores is the formatted line,
 * because the server resolves a zone by finding an area name inside it.
 */
export default function DeliveryAddress() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading, updateProfile } = useAuth();
  const { t } = useT();

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');


  // Open on whichever saved address already matches the account, so the page
  // reflects what the kitchen currently has rather than an arbitrary pick.
  //
  // On a device that has never saved this address there is nothing to match:
  // the book lives in the browser, and the account only kept the flattened
  // line. That showed "No saved addresses" directly above "Current: Salmiya,
  // Block 10…" — the address was known and still had to be retyped. So when
  // the account carries the parts, they are put into this browser's book
  // first, and the match then succeeds as it would have on the device that
  // typed it.
  useEffect(() => {
    if (selected || !user?.deliveryAddress) return;

    hydrateFromAccount(user);

    const match = listAddresses().find(
      (a) => formatAddress(a) === user.deliveryAddress,
    );
    setSelected(match || defaultAddress());
  }, [user, selected]);

  const save = async () => {
    if (!selected) {
      setError(t('checkoutSelectAddress'));
      return;
    }
    setSaving(true);
    setError('');
    setSaved('');
    try {
      // Both halves: the line the kitchen prints, and the parts that let this
      // form be filled in again somewhere else.
      // Named one by one rather than spread: `id` and `isDefault` are this
      // browser's bookkeeping, and the schema rejects keys it does not know.
      await updateProfile({
        deliveryAddress: formatAddress(selected),
        deliveryAddressDetails: {
          label: selected.label || '',
          areaId: selected.areaId || '',
          block: selected.block || '',
          street: selected.street || '',
          jadda: selected.jadda || '',
          building: selected.building || '',
          floor: selected.floor || '',
          apartment: selected.apartment || '',
          notes: selected.notes || '',
        },
      });
      setSaved(t('deliveryAddressSaved'));
    } catch (err) {
      setError(err?.message || t('networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <SignInPrompt reason={t('authGatePlan')} />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold mb-1">{t('planEditAddress')}</h1>
        <p className="text-text-secondary text-sm mb-6">{t('whereBoxesGo')}</p>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saved}</span>
          </div>
        )}

        <AddressPicker value={selected} onChange={setSelected} />

        {user?.deliveryAddress && (
          <p className="flex items-start gap-2 text-xs text-text-secondary mt-4">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {t('current')}: {user.deliveryAddress}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !selected}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('commonSave')}
        </button>
      </div>
    </div>
  );
}
