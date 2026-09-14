import { api } from './api';

export const offerService = {
  getOffers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.active !== undefined) query.append('active', params.active);
    const queryString = query.toString();
    const path = queryString ? `offer?${queryString}` : 'offer';
    return api.get(path);
  },
  getOfferById: (id) => api.get(`offer/${id}`),
  createOffer: (formData) => api.post('offer', formData, { auth: true }),
  updateOffer: (id, formData) => api.patch(`offer/${id}`, formData, { auth: true }),
  deleteOffer: (id) => api.delete(`offer/${id}`, { auth: true }),
};