import { api } from './api';

export const supportService = {
  submitTicket: (data) => api.post('support', data),
  getTickets: (status) =>
    api.get(
      status ? `support/admin?status=${encodeURIComponent(status)}` : 'support/admin',
      { auth: true }
    ),
  resolveTicket: (ticketId) =>
    api.patch(`support/admin/${ticketId}/resolve`, {}, { auth: true }),
};
