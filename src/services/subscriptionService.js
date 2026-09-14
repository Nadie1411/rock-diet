import { api } from './api';

/**
 * Buying and holding a subscription.
 *
 * A subscription is paid for once, up front, and its daily deliveries are what
 * that money buys — so `checkout` opens a payment rather than switching the
 * plan on. Nothing is applied and no food is cooked until the gateway
 * confirms.
 */
export const subscriptionService = {
  getStatus: () => api.get('user/subscription-status', { auth: true }),

  /**
   * Prices a choice without opening a payment. Quoting one figure and charging
   * another is the failure this exists to prevent, so the review step shows
   * what this returns rather than adding anything up itself.
   */
  quote: ({ slug, duration, selection }) =>
    api.post(
      'user/subscription/quote',
      { package: slug, duration, ...selection },
      // Not an authenticated call: pricing reads nothing about who is asking,
      // and a visitor has to see what it costs before deciding to register.
      // Marking it `auth` meant a guest's 401 was reported to them as an
      // expired session, on a page they had never been signed in to.
    ),

  /**
   * Opens payment for a term. Answers with a `paymentUrl` to send them to.
   *
   * Every field is named here, and this list has to grow with the wizard.
   * It did not: `couponCode`, `acceptAllergens` and `firstWeeks` were passed
   * in by the review screen and dropped on this line, so a discount was shown
   * and then not charged, an accepted allergy warning never arrived, and a
   * week of chosen meals went nowhere.
   */
  checkout: ({
    slug,
    duration,
    selection,
    firstDayProductIds = [],
    firstWeeks,
    acceptAllergens,
    couponCode,
  }) =>
    api.post(
      'user/subscription/checkout',
      {
        package: slug,
        duration,
        firstDayProductIds,
        ...(firstWeeks?.length && { firstWeeks }),
        ...(acceptAllergens && { acceptAllergens }),
        ...(couponCode && { couponCode }),
        ...selection,
      },
      { auth: true },
    ),

  /**
   * Changes package on an existing subscription. Defaults to taking effect at
   * the end of the term already paid for; "now" is only honoured once the new
   * package has been paid for.
   */
  setPackageSelection: ({ slug, selection, when }) =>
    api.patch(
      'user/package-selection',
      { package: slug, ...selection, ...(when && { when }) },
      { auth: true },
    ),

  pause: (paused = true) =>
    api.patch('user/subscription/pause', { paused }, { auth: true }),
};
