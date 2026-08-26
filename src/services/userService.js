import { api } from './api';

export const userService = {
  getSubscribers: () => api.get('user/admin/subscribers', { auth: true }),
  updateSubscription: (userId, data) =>
    api.patch(`user/admin/${userId}/subscription`, data, { auth: true }),
  updateWeeklyMeals: (userId, weeklyMeals) =>
    api.put(`user/admin/${userId}/weekly-meals`, { weeklyMeals }, { auth: true }),
  adminCreateUser: (data) =>
    api.post('user/admin/create-user', data, { auth: true }),
};
