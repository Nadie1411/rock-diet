/**
 * The customer's saved addresses.
 *
 * Kept in this browser, not on the server — the same place the mobile app
 * keeps them (`SharedPreferences`, key `rd_addresses`). The API has no
 * address collection to sync with: an order carries its address as a written
 * line, and a subscription has one `deliveryAddress` on the account.
 *
 * Fields mirror the app's `Address` model so the two ask for the same things
 * in the same order, and `format()` is the single place a saved address
 * becomes the line the API is sent — the zone is resolved by finding an area
 * name inside that line, so the area has to lead it.
 */

const KEY = 'rd_addresses';

export const LABELS = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

export const EMPTY_ADDRESS = {
  label: 'home',
  areaId: '',
  block: '',
  street: '',
  jadda: '',
  building: '',
  floor: '',
  apartment: '',
  notes: '',
  isDefault: false,
};

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private browsing, cleared storage, or something else wrote nonsense
    // here. An empty book is recoverable; a thrown error at checkout is not.
    return [];
  }
};

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Nothing to do — the address still works for this order, it just
    // won't be remembered.
  }
  return list;
};

export const listAddresses = () => read();

export const defaultAddress = () => {
  const all = read();
  return all.find((a) => a.isDefault) || all[0] || null;
};

export const saveAddress = (address) => {
  const all = read();
  const id = address.id || `a${Date.now()}`;
  const next = { ...EMPTY_ADDRESS, ...address, id };

  // Exactly one default. Marking a new one demotes the rest rather than
  // leaving two and letting whichever sorts first win.
  const cleared = next.isDefault
    ? all.map((a) => ({ ...a, isDefault: false }))
    : all;

  const existing = cleared.findIndex((a) => a.id === id);
  const list =
    existing >= 0
      ? cleared.map((a, i) => (i === existing ? next : a))
      : [...cleared, next];

  // A book with one address has a default whether or not it was ticked.
  if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true;

  return write(list);
};

/**
 * Put the account's saved address into this browser's book.
 *
 * The book is per-browser, so signing in somewhere new showed "no saved
 * addresses" beneath the customer's own current address and asked them to
 * type it again. The account carries the parts as well as the printed line,
 * and this is where they come back.
 *
 * Does nothing when the book already holds that address, so it seeds a fresh
 * browser without ever fighting an edit made on this one.
 */
export const hydrateFromAccount = (user) => {
  const line = user?.deliveryAddress;
  const details = user?.deliveryAddressDetails;
  if (!line || !details?.areaId) return read();

  const all = read();
  if (all.some((a) => format(a) === line)) return all;

  return saveAddress({ ...details, isDefault: !all.length });
};

export const removeAddress = (id) => {
  const list = read().filter((a) => a.id !== id);
  if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true;
  return write(list);
};

export const setDefaultAddress = (id) =>
  write(read().map((a) => ({ ...a, isDefault: a.id === id })));

/** An area id like "abu-halifa" as the kitchen writes it: "Abu Halifa". */
export const areaName = (areaId = '') =>
  areaId
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * The single line the API is sent.
 *
 * Area first: the server resolves a delivery zone by looking for an area name
 * inside this string, so burying it after the block risks no match and a
 * "we do not deliver to that area yet" on an address that is perfectly
 * deliverable.
 */
export const format = (a) => {
  if (!a) return '';
  const parts = [
    areaName(a.areaId),
    a.block && `Block ${a.block}`,
    a.street && `Street ${a.street}`,
    a.jadda && `Jadda ${a.jadda}`,
    a.building && `Building ${a.building}`,
    a.floor && `Floor ${a.floor}`,
    a.apartment && `Flat ${a.apartment}`,
  ].filter(Boolean);
  return parts.join(', ');
};
