import { api } from './api';

export const planService = {
  getPlans: () => api.get('meal-plan', { auth: true }),
  createPlan: (data) => api.post('meal-plan', data, { auth: true }),
  updatePlan: (planId, data) => api.put(`meal-plan/${planId}`, data, { auth: true }),
  deletePlan: (planId) => api.delete(`meal-plan/${planId}`, { auth: true }),
  assignPlan: (planId, userId) =>
    api.post(`meal-plan/${planId}/assign/${userId}`, {}, { auth: true }),
};
