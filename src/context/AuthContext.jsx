import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Try to load profile on mount — if httpOnly cookie exists, this succeeds
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
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
    // Backend sets httpOnly cookies in the response
    const res = await authService.login({ email, password });
    setIsAuthenticated(true);
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
      await authService.logout();
    } catch {
      // Even if backend revoke fails, clear local state
    }
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
