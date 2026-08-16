import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user profile on mount if token exists
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        // Token invalid or expired - clear
        api.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Listen for forced logout (expired refresh token)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password });
    api.setTokens(res.data);
    setIsAuthenticated(true);
    // Fetch profile after login
    try {
      const profile = await authService.getProfile();
      setUser(profile.data);
    } catch {
      setUser(null);
    }
    return res;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await authService.signup(data);
    return res;
  }, []);

  const confirmEmail = useCallback(async (email, otp) => {
    const res = await authService.confirmEmail(email, otp);
    return res;
  }, []);

  const resendOtp = useCallback(async (email) => {
    const res = await authService.resendOtp(email);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Revoke token on backend
      await authService.logout();
    } catch {
      // Even if backend revoke fails, clear local tokens
    }
    api.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    confirmEmail,
    resendOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}