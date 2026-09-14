import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Home,
  Briefcase,
  AlertCircle,
  Truck,
} from 'lucide-react';

import { zoneService } from '../services/zoneService';
import { useT } from '../i18n/useT';
import { useAuth } from '../context/AuthContext';
import {
  EMPTY_ADDRESS,
  LABELS,
  areaName,
  format,
  removeAddress,
  hydrateFromAccount,
  saveAddress,
} from '../utils/addressBook';
import { blockingIssue, deliveryFor, zoneForArea } from '../utils/zones';

/**
 * Choosing where an order goes.
 *
 * The app picks from a saved address book rather than retyping a line every
 * time, and shows what the zone costs before the order is placed — the server
 * refuses an unserved area and a basket under the zone's minimum, and finding
 * that out at "place order" is finding out too late.
 *
 * Addresses live in this browser, as they do on the device in the app. What
 * the API receives is the formatted line.
 */
const LABEL_ICONS = { home: Home, work: Briefcase, other: MapPin };

const kd = (n) => `KD ${Number(n || 0).toFixed(3)}`;

export default function AddressPicker({
  value,
  onChange,
  subtotal = 0,
  onIssueChange,
}) {
  const { t } = useT();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [zones, setZones] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    zoneService
      .getZones()
      .then((res) => setZones(res.data || []))
      .catch(() => setZones([]));
  }, []);

  // Seed from the account before listing, so checkout on a new browser opens
  // on the address already on file instead of an empty book. Keyed on `user`
  // rather than on mount: the account arrives after the first render, and
  // reading the book once at mount would miss it every time.
  useEffect(() => {
    setAddresses(hydrateFromAccount(user));
  }, [user]);

  // Adopt the default address once, so checkout opens on something usable.
  useEffect(() => {
    if (value || !addresses.length) return;
    const preferred = addresses.find((a) => a.isDefault) || addresses[0];
    if (preferred) onChange?.(preferred);
  }, [addresses, value, onChange]);

  const zone = useMemo(
    () => zoneForArea(zones, value?.areaId),
    [zones, value],
  );
  const delivery = useMemo(
    () => deliveryFor(zone, subtotal),
    [zone, subtotal],
  );
  const issue = useMemo(
    () => blockingIssue({ zones, areaId: value?.areaId, subtotal }),
    [zones, value, subtotal],
  );

  // Let checkout disable its own submit rather than duplicating the rules.
  useEffect(() => {
    onIssueChange?.(issue);
  }, [issue, onIssueChange]);

  const persist = useCallback(
    (address) => {
      const list = saveAddress(address);
      setAddresses(list);
      const saved = list.find((a) => a.id === address.id) || list[list.length - 1];
      onChange?.(saved);
      setEditing(null);
    },
    [onChange],
  );

  const drop = (id) => {
    const list = removeAddress(id);
    setAddresses(list);
    if (value?.id === id) onChange?.(list.find((a) => a.isDefault) || list[0] || null);
  };

  if (editing) {
    return (
      <AddressForm
        initial={editing}
        zones={zones}
        onCancel={() => setEditing(null)}
        onSave={persist}
      />
    );
  }

  return (
    <div className="space-y-3">
      {!addresses.length ? (
        <div className="rounded-xl border border-dashed border-border p-5 text-center">
          <MapPin className="w-6 h-6 mx-auto text-text-secondary/50 mb-2" />
          <p className="text-sm text-text-secondary mb-3">{t('addressEmpty')}</p>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY_ADDRESS })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addressAdd')}
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {addresses.map((a) => {
              const Icon = LABEL_ICONS[a.label] || MapPin;
              const selected = value?.id === a.id;
              const aZone = zoneForArea(zones, a.areaId);
              const unserved = zones.length > 0 && !aZone;
              return (
                <li key={a.id}>
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onChange?.(a)}
                      className="flex items-start gap-3 min-w-0 flex-1 text-start"
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selected ? 'bg-primary text-on-primary' : 'bg-bg text-text-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold">
                            {t(`address${a.label.charAt(0).toUpperCase()}${a.label.slice(1)}`)}
                          </span>
                          {a.isDefault && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                              {t('addressDefault')}
                            </span>
                          )}
                          {unserved && (
                            <span className="px-1.5 py-0.5 rounded bg-error/10 text-error text-[10px] font-bold">
                              {t('addressNotServed')}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-text-secondary mt-0.5 truncate">
                          {format(a)}
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(a)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-primary"
                        aria-label={t('commonEdit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => drop(a.id)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-error"
                        aria-label={t('commonDelete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY_ADDRESS })}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-border text-xs font-bold text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('addressAdd')}
          </button>
        </>
      )}

      {/* What this address costs to deliver to, or why it can't be used. */}
      {issue?.kind === 'unserved' && (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-error/10 text-error text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {t('checkoutAreaNotServed')}
        </p>
      )}

      {issue?.kind === 'belowMinimum' && (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-warning" />
          {t('checkoutBelowMinimum', {
            zone: issue.zone.name,
            amount: kd(issue.minimum),
          })}
        </p>
      )}

      {zone && !issue && (
        <p className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 text-xs">
          <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
          <span>
            {zone.estimatedMinutes
              ? t('checkoutZoneEta', {
                  zone: zone.name,
                  minutes: zone.estimatedMinutes,
                })
              : zone.name}
            {' · '}
            {delivery.free ? t('cartFree') : kd(delivery.fee)}
          </span>
        </p>
      )}
    </div>
  );
}

/** Adding or changing one address. Same fields, in the same order, as the app. */
function AddressForm({ initial, zones, onCancel, onSave }) {
  const { t } = useT();
  const [form, setForm] = useState({ ...EMPTY_ADDRESS, ...initial });
  const [error, setError] = useState('');

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  /*
   * Not a form submit, and this must not become one again.
   *
   * The picker is rendered inside checkout's own <form>. A nested form is
   * invalid HTML, and worse, the inner submit event bubbled to the outer
   * one — so pressing "Save" on an address ran handlePlaceOrder and pushed
   * the customer into payment when all they had done was type their street.
   * preventDefault stops the browser's default; it does not stop the event
   * reaching the form above.
   */
  const submit = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!form.areaId) {
      setError(t('addressSelectArea'));
      return;
    }
    // The app requires these three; a driver cannot find a flat without them.
    if (!form.block.trim() || !form.street.trim() || !form.building.trim()) {
      setError(t('addressIncomplete'));
      return;
    }
    onSave(form);
  };

  return (
    <div
      // Enter still saves, because a div does not do it for free and typing
      // an address then pressing Enter is what people do.
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') submit(e);
      }}
      className="rounded-xl border border-border bg-surface p-4 space-y-3"
    >
      {error && (
        <p className="flex items-start gap-2 p-2.5 rounded-lg bg-error/10 text-error text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1.5">{t('addressLabel')}</label>
        <div className="grid grid-cols-3 gap-2">
          {LABELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => set('label', l.value)}
              className={`px-2 py-2 rounded-lg border text-xs font-bold transition-colors ${
                form.label === l.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-text-secondary'
              }`}
            >
              {t(`address${l.value.charAt(0).toUpperCase()}${l.value.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1.5">{t('addressArea')}</label>
        <select
          value={form.areaId}
          onChange={(e) => set('areaId', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary"
        >
          <option value="">{t('addressSelectArea')}</option>
          {zones.map((z) => (
            <optgroup key={z._id} label={z.name}>
              {(z.areas || []).map((a) => (
                <option key={a} value={a}>
                  {areaName(a)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-[11px] text-text-secondary mt-1">{t('addressKuwaitOnly')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('addressBlock')} value={form.block} onChange={(v) => set('block', v)} />
        <Field label={t('addressStreet')} value={form.street} onChange={(v) => set('street', v)} />
        <Field label={t('addressJadda')} value={form.jadda} onChange={(v) => set('jadda', v)} hint={t('addressJaddaHint')} />
        <Field label={t('addressBuilding')} value={form.building} onChange={(v) => set('building', v)} />
        <Field label={t('addressFloor')} value={form.floor} onChange={(v) => set('floor', v)} />
        <Field label={t('addressApartment')} value={form.apartment} onChange={(v) => set('apartment', v)} />
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
        <span
          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            form.isDefault ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {form.isDefault && <Check className="w-2.5 h-2.5 text-on-primary" strokeWidth={4} />}
        </span>
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set('isDefault', e.target.checked)}
          className="sr-only"
        />
        {t('addressSetDefault')}
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-bold"
        >
          {t('commonCancel')}
        </button>
        <button
          type="button"
          onClick={submit}
          className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold"
        >
          {t('commonSave')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:border-primary"
      />
      {hint && <p className="text-[10px] text-text-secondary mt-1">{hint}</p>}
    </div>
  );
}
