/**
 * The subscription a visitor built before they had an account.
 *
 * Signing up is asked for at the pay button, which means leaving the wizard
 * with five steps of choices behind them — package, measurements, macros,
 * meals per day, the first day's dishes — and coming back through a signup
 * form, an email code and a sign-in. Three screens, any of which could drop
 * the lot.
 *
 * So the draft lives here rather than inside the wizard: the signup form
 * reads it to fill in what they already told us, and the screens at the end
 * of that journey read it to know where to send them back to.
 *
 * In `localStorage`, not `sessionStorage`, because the journey leaves the tab.
 * Confirming an email means opening a link from a mail app, which starts a
 * fresh tab with an empty `sessionStorage` — so the draft vanished at exactly
 * the point it was needed, and someone who had just created an account to buy
 * was returned to the home page with five steps of choices gone.
 *
 * Given an expiry instead, since it now outlives the tab: long enough to
 * finish signing up and come back, short enough that a plan priced last month
 * is not silently restored.
 */
const KEY = 'rd_subscribe_draft';

/** How long a half-finished purchase is worth keeping. */
const TTL_MS = 24 * 60 * 60 * 1000;

export const readDraft = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw);
    if (stored?.savedAt && Date.now() - stored.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return stored?.draft ?? null;
  } catch {
    // Private browsing refuses storage, and a corrupt draft is not worth a
    // broken page. Either way there is simply nothing to restore.
    return null;
  }
};

export const writeDraft = (draft) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), draft }));
  } catch {
    /* the wizard still works, it just cannot survive the trip */
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(KEY);
    // Anything left by the version that kept this per-tab.
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};

/** True when someone is part-way through buying and should be sent back. */
export const hasDraft = () => Boolean(readDraft()?.slug);

/**
 * What signup can fill in from what they already entered.
 *
 * Only the fields the wizard genuinely collected — asking someone their
 * height twice in one sitting is the kind of thing that loses a sale.
 */
export const draftProfile = () => {
  const d = readDraft();
  if (!d?.profile) return null;

  const { age, weight, height, gender, activityLevel } = d.profile;
  return {
    ...(age && { age: String(age) }),
    ...(weight && { weight: String(weight) }),
    ...(height && { height: String(height) }),
    ...(gender && { gender }),
    ...(activityLevel && { activityLevel }),
    ...(d.goal && { goal: d.goal }),
  };
};
