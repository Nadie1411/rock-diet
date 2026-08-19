import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/notificationService";
import {
  requestNotificationPermission,
  onMessageListener,
} from "../config/firebase";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAdmin, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unhandledCount, setUnhandledCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const pollingRef = useRef(null);
  const fcmTokenRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  // Fetch unhandled count
  const fetchUnhandledCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnhandledCount();
      setUnhandledCount(res.data?.count || 0);
    } catch {
      // silent
    }
  }, [isAuthenticated]);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 20 });
      setNotifications(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  // Mark single notification as handled
  const markAsHandled = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsHandled(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, handled: true, handledAt: new Date().toISOString(), read: true } : n
        )
      );
      setUnhandledCount((prev) => Math.max(0, prev - 1));
      fetchUnreadCount();
    } catch (err) {
      console.error("markAsHandled failed:", err);
    }
  }, [fetchUnreadCount]);

  // Mark all as handled
  const markAllAsHandled = useCallback(async () => {
    try {
      await notificationService.markAllAsHandled();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, handled: true, handledAt: new Date().toISOString(), read: true }))
      );
      setUnhandledCount(0);
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  // Show toast notification for foreground messages
  const showToast = useCallback((payload) => {
    const { title, body } = payload.notification || {};
    setToast({ title, body, id: Date.now() });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Dismiss toast
  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Setup FCM for admin users
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const setupFCM = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token && token !== fcmTokenRef.current) {
          fcmTokenRef.current = token;
          await notificationService.saveFcmToken(token).catch(() => {});
        }
      } catch {
        // FCM setup failed, continue without push notifications
      }
    };

    setupFCM();

    // Listen for foreground messages
    const unsubscribe = onMessageListener((payload) => {
      showToast(payload);
      fetchUnreadCount();
      fetchUnhandledCount();
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isAuthenticated, isAdmin, showToast, fetchUnreadCount, fetchUnhandledCount]);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchUnhandledCount();
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setUnhandledCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchUnhandledCount, fetchNotifications]);

  // Poll unread + unhandled count every 30 seconds for admins
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
      fetchUnhandledCount();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isAuthenticated, isAdmin, fetchUnreadCount, fetchUnhandledCount]);

  // Clean up FCM token on logout
  useEffect(() => {
    if (!isAuthenticated && fcmTokenRef.current) {
      notificationService
        .removeFcmToken(fcmTokenRef.current)
        .catch(() => {});
      fcmTokenRef.current = null;
    }
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    unhandledCount,
    loading,
    dropdownOpen,
    toast,
    fetchNotifications,
    fetchUnreadCount,
    fetchUnhandledCount,
    markAsRead,
    markAllAsRead,
    markAsHandled,
    markAllAsHandled,
    toggleDropdown,
    closeDropdown,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
