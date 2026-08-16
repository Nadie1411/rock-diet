import { api } from './api';

export const authService = {
  signup: (data) => api.post('auth/signup', data),
  login: (data) => api.post('auth/login', data),
  refreshToken: (refresh_token) => api.post('auth/refresh-token', { refresh_token }),
  resendOtp: (email) => api.post('auth/resend-otp', { email }),
  confirmEmail: (email, otp) => api.patch('auth/confirm-email', { email, otp }),
  getProfile: () => api.get('user', { auth: true }),
  logout: () => api.post('auth/logout', {}, { auth: true }),
};
