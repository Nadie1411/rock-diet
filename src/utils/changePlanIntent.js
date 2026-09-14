/**
 * Proof that the customer deliberately asked to change plan.
 *
 * Someone with a running subscription should not meet the package picker by
 * accident — not from a bookmark, the back button, an old tab, or a link
 * someone sent them. So the picker asks for this, and only the "Change plan"
 * confirmation grants it.
 *
 * `sessionStorage`, deliberately:
 *
 *  - not the URL, or the flow could be bookmarked and shared, and a query
 *    parameter would be the whole check;
 *  - not router state, which a refresh discards — that would strand someone
 *    part-way through for pressing reload;
 *  - not `localStorage`, which would still be granting entry tomorrow, in
 *    every tab.
 *
 * It survives a reload of the tab that earned it, and nothing else. Note this
 * gates only what is *shown*: nothing here activates a plan. The server
 * starts a subscription from a confirmed payment and from nothing else.
 */
const KEY = 'rd_change_plan_intent';

/** Granted by the Change plan confirmation, and nowhere else. */
export const beginChangePlan = () => {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Private browsing can refuse storage. The guard falls back to closed,
    // which keeps the subscription safe and costs a re-confirm.
  }
};

export const isChangingPlan = () => {
  try {
    return Boolean(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
};

/** Spent once the flow ends — completed, abandoned or navigated away from. */
export const endChangePlan = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};
