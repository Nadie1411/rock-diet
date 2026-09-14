import { api } from './api';

export const packageService = {
  /** Public — someone deciding whether to subscribe sees this before signing in. */
  getPackages: () => api.get('package'),

  getPackageBySlug: (slug) => api.get(`package/${slug}`),

  /**
   * Corrects a customer's choices against the package's rules and prices the
   * result, so the figure on screen is the one the order will be charged at.
   *
   * The server is the authority here: it snaps portions to what the package
   * offers, clamps a flexible package to its band, holds the day inside
   * min/max meals, and returns `notes` explaining anything it changed.
   */
  previewSelection: (slug, selection) =>
    api.post(`package/${slug}/selection`, selection),
};
