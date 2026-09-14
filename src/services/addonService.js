import { api } from './api';

export const addonService = {
  getAddons: (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.append('isActive', params.isActive);
    const queryString = query.toString();
    const path = queryString ? `addon?${queryString}` : 'addon';
    return api.get(path);
  },
  getAddonById: (id) => api.get(`addon/${id}`),
  createAddon: (formData) => api.post('addon', formData, { auth: true }),
  updateAddon: (id, formData) => api.patch(`addon/${id}`, formData, { auth: true }),
  deleteAddon: (id) => api.delete(`addon/${id}`, { auth: true }),
};
