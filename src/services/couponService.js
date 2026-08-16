import { api } from './api';

export const couponService = {
  getCoupons: (params = {}) => {
    const query = new URLSearchParams();
    if (params.active !== undefined) query.append('active', params.active);
    const queryString = query.toString();
    const path = queryString ? `coupon?${queryString}` : 'coupon';
    return api.get(path);
  },
  getCouponById: (id) => api.get(`coupon/${id}`),
  createCoupon: (data) => api.post('coupon', data, { auth: true }),
  updateCoupon: (id, data) => api.patch(`coupon/${id}`, data, { auth: true }),
  deleteCoupon: (id) => api.delete(`coupon/${id}`, { auth: true }),
  validateCoupon: (code, orderTotal) =>
    api.post('coupon/validate', { code, orderTotal }, { auth: true }),
};