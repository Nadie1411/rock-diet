import { api } from './api';

export const orderService = {
  createOrder: (data) => api.post('order', data, { auth: true }),
  getUserOrders: () => api.get('order/my-orders', { auth: true }),
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    const queryString = query.toString();
    const path = queryString ? `order/all?${queryString}` : 'order/all';
    return api.get(path, { auth: true });
  },
  getOrderById: (orderId) => api.get(`order/${orderId}`, { auth: true }),
  updateOrderStatus: (orderId, status) =>
    api.patch(`order/${orderId}/status`, { status }, { auth: true }),
  cancelOrder: (orderId) => api.delete(`order/${orderId}`, { auth: true }),
};
