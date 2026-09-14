/**
 * The daily calorie target, computed the way the kitchen computes it.
 *
 * Mifflin-St Jeor, times an activity multiplier, adjusted for the goal. The
 * numbers are not hard-coded here: they come from GET /settings/public, the
 * same source the mobile app reads, so when the kitchen revises a deficit
 * from the admin panel the website follows within seconds instead of needing
 * a rebuild.
 *
 * Used only to suggest a package. Nothing here is sent to the server — the
 * account's own stored calories remain what the kitchen cooks against.
 */

/** Mirrors the server's defaults, for the moment before settings arrive. */
export const DEFAULT_CALORIE_CONFIG = {
  weightLossDeficit: 500,
  muscleGainSurplus: 300,
  minCaloriesMale: 1500,
  minCaloriesFemale: 1200,
  activity: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  },
};

/**
 * @param {object} profile age, weight (kg), height (cm), gender, activityLevel
 * @param {string} goal weight_loss | maintenance | bulking
 * @param {object} config the `calories` block from GET /settings/public
 */
export const targetCalories = (profile, goal, config = DEFAULT_CALORIE_CONFIG) => {
  const age = Number(profile?.age);
  const weight = Number(profile?.weight);
  const height = Number(profile?.height);

  if (!Number.isFinite(age) || !Number.isFinite(weight) || !Number.isFinite(height)) {
    return null;
  }

  const isMale = profile?.gender === 'male';

  // Mifflin-St Jeor.
  const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);

  const activity =
    config?.activity?.[profile?.activityLevel] ??
    config?.activity?.moderate ??
    DEFAULT_CALORIE_CONFIG.activity.moderate;

  let total = bmr * activity;

  if (goal === 'weight_loss') {
    total -= config?.weightLossDeficit ?? DEFAULT_CALORIE_CONFIG.weightLossDeficit;
  } else if (goal === 'bulking') {
    total += config?.muscleGainSurplus ?? DEFAULT_CALORIE_CONFIG.muscleGainSurplus;
  }

  // The floor matters: an older, smaller, sedentary profile on a deficit can
  // otherwise be prescribed a target no one should be eating to.
  const floor = isMale
    ? (config?.minCaloriesMale ?? DEFAULT_CALORIE_CONFIG.minCaloriesMale)
    : (config?.minCaloriesFemale ?? DEFAULT_CALORIE_CONFIG.minCaloriesFemale);

  return Math.round(Math.max(total, floor));
};
