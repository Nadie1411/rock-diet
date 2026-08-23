import { api } from './api';

export const authService = {
  signup: (data) => api.post('auth/signup', data),
  login: (data) => api.post('auth/login', data),
  refreshToken: (refreshToken) => api.post('auth/refresh-token', { refresh_token: refreshToken }),
  resendOtp: (email) => api.post('auth/resend-otp', { email }),
  confirmEmail: (email, otp) => api.patch('auth/confirm-email', { email, otp }),
  getProfile: () => api.get('user', { auth: true }),
  updateProfile: (data) => api.patch('user', data, { auth: true }),
  logout: () => api.post('auth/logout', {}, { auth: true }),
};
