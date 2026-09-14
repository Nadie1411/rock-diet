import { api } from './api';

/**
 * A subscriber picks their week of meals in advance.
 *
 * The API answers with two weeks — this one and next. The current week is
 * almost always past its deadline already, so seeing what is coming without
 * being able to change it is the normal state, not an error.
 */
export const weekPlanService = {
  /**
   * What this customer may choose from, slot by slot, and what each slot is
   * worth in grams.
   *
   * A package fixes the day's protein and carbohydrate, so the menu it offers
   * is not the whole catalogue — it is the dishes the package covers that can
   * honestly be plated at that size. The server decides it, because the same
   * rule already governs the week it fills on the customer's behalf and the
   * two must not disagree.
   */
  getOptions: () => api.get('weekplan/options', { auth: true }),

  /** `[{ plan, deadline, canChoose }, …]` — this week first, then next. */
  getUpcoming: () => api.get('weekplan', { auth: true }),

  /**
   * `days` are `{ dayOfWeek, productIds }` with dayOfWeek 1-7, Monday to
   * Sunday. The server refuses a week containing meals outside the
   * customer's package, or anything they've marked as an allergen.
   */
  setWeek: ({ weekStart, mealsPerDay, days, acceptAllergens = false }) =>
    api.patch(
      'weekplan',
      {
        weekStart,
        ...(mealsPerDay && { mealsPerDay }),
        days,
        // Only ever true because the customer confirmed a dialog naming the
        // ingredient. Never sent on a first attempt.
        ...(acceptAllergens && { acceptAllergens: true }),
      },
      { auth: true },
    ),
};
