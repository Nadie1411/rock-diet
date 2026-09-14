import { api } from './api';

/**
 * What the kitchen must not put in front of this customer.
 *
 * Two lists, deliberately separate: `forbidden` is an allergy and is enforced
 * — a week containing one is refused — while `disliked` only steers the
 * kitchen's choice when it fills a week on the customer's behalf.
 */
export const exclusionService = {
  /** Public: the form is shown before signup has finished. */
  getCatalog: () => api.get('exclusion/catalog'),

  getMine: () => api.get('exclusion/me', { auth: true }),

  /**
   * Whole groups are accepted as well as individual items. Someone who cannot
   * tolerate lactose means all of it, and asking them to tick milk, laban,
   * cheese and yoghurt separately makes their safety depend on not missing
   * one — "dairy" says the thing they actually mean.
   */
  setMine: ({ forbidden, disliked, notes }) =>
    api.patch(
      'exclusion/me',
      { forbidden, disliked, notes },
      { auth: true },
    ),
};
