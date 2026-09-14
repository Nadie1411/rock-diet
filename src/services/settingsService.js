import { api } from './api';

export const settingsService = {
  /**
   * Unauthenticated and carrying no credentials — the currency, the
   * subscription edit cut-off and the calorie formula. Both clients read it,
   * so the kitchen can change a deficit or a multiplier from the admin panel
   * and the website follows without a rebuild.
   */
  getPublicSettings: () => api.get('settings/public'),
};
