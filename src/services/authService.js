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

  /**
   * Answers identically whether or not the address has an account.
   *
   * Confirming that an email is registered, on an endpoint needing no
   * sign-in, is a free account-enumeration oracle — so the UI must not treat
   * success as "this account exists" either.
   */
  forgotPassword: (email) => api.post('auth/forgot-password', { email }),

  /**
   * A successful reset stamps `passwordChangedAt`, which the authentication
   * middleware compares against every token's `iat` — so every existing
   * session, on every device, is refused immediately afterwards.
   */
  resetPassword: ({ email, otp, password, confirmPassword }) =>
    api.patch('auth/reset-password', { email, otp, password, confirmPassword }),

  changePassword: ({ currentPassword, newPassword }) =>
    api.patch(
      'user/change-password',
      { currentPassword, newPassword },
      { auth: true },
    ),
};
