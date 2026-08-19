import { api } from './api';

export const notificationService = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    const path = queryString ? `notification?${queryString}` : 'notification';
    return api.get(path, { auth: true });
  },

  getUnreadCount: () => api.get('notification/unread-count', { auth: true }),

  getUnhandledCount: () => api.get('notification/unhandled-count', { auth: true }),

  markAsRead: (notificationId) =>
    api.patch(`notification/${notificationId}/read`, {}, { auth: true }),

  markAllAsRead: () =>
    api.patch('notification/read-all', {}, { auth: true }),

  markAsHandled: (notificationId) =>
    api.patch(`notification/${notificationId}/handle`, {}, { auth: true }),

  markAllAsHandled: () =>
    api.patch('notification/handle-all', {}, { auth: true }),

  saveFcmToken: (token) =>
    api.post('notification/fcm-token', { token }, { auth: true }),

  removeFcmToken: (token) =>
    api.delete('notification/fcm-token', {
      auth: true,
      body: { token },
    }),
};
