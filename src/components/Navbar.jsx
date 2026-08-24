import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  BookOpen,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  User,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Bell,
  CheckCheck,
  CheckCircle,
  Package,
  Headphones,
} from "lucide-react";
import rockDietLogo from "../assets/rock-diet-logo.png";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotification } from "../context/NotificationContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { cartItemCount, openCart } = useCart();
  const {
    unhandledCount,
    notifications,
    dropdownOpen,
    toast,
    toggleDropdown,
    closeDropdown,
    markAsRead,
    markAsHandled,
    markAllAsHandled,
    dismissToast,
  } = useNotification();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close notification dropdown on outside click (ignores bell buttons)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest("[data-notification-bell]")
      ) {
        closeDropdown();
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, closeDropdown]);

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/");
  };

  const notificationTarget = (notif) =>
    notif.type === "support" ? "/admin?tab=support" : "/admin?tab=orders";

  const handleNotificationBellClick = useCallback(() => {
    toggleDropdown();
  }, [toggleDropdown]);

  const navItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Menu", path: "/menu", icon: BookOpen },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
  ];

  if (isAdmin) {
    navItems.push({ name: "Admin", path: "/admin", icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group focus:outline-none shrink-0"
          >
            <img
              src={rockDietLogo}
              alt="Rock Diet"
              className="h-[52px] sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary hover:text-primary hover:bg-surface"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide text-xs">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Cart Icon Button */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5 hidden md:block" />
              <ShoppingCart className="w-6 h-6 md:hidden" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-on-primary text-[10px] font-extrabold flex items-center justify-center border-2 border-bg shadow-sm animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Notification Bell (Admin only) */}
            {isAdmin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleNotificationBellClick}
                  className="relative p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface transition-colors"
                  aria-label="Notifications"
                  data-notification-bell
                >
                  <Bell className="w-5 h-5 hidden md:block" />
                  <Bell className="w-6 h-6 md:hidden" />
                  {unhandledCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-bg shadow-sm animate-pulse">
                      {unhandledCount > 99 ? "99+" : unhandledCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown — Desktop */}
                <div
                  className={`${
                    dropdownOpen ? "block" : "hidden"
                  } absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
                    <h3 className="text-sm font-bold text-text">
                      Notifications
                    </h3>
                    {unhandledCount > 0 && (
                      <button
                        onClick={markAllAsHandled}
                        className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary-light transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Handle all
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-text-secondary">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-semibold">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <div
                          key={notif._id}
                          className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${
                            !notif.handled
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "bg-bg/30 opacity-60"
                          }`}
                        >
                          <button
                            onClick={() => {
                              markAsRead(notif._id);
                              closeDropdown();
                              navigate(notificationTarget(notif));
                            }}
                            className="w-full text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 p-1.5 rounded-lg ${
                                  notif.handled
                                    ? "bg-success/10 text-success"
                                    : notif.type === "support"
                                      ? "bg-warning/10 text-warning"
                                      : notif.type === "order"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-accent/10 text-accent"
                                }`}
                              >
                                {notif.handled ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : notif.type === "support" ? (
                                  <Headphones className="w-4 h-4" />
                                ) : (
                                  <Package className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-bold text-text truncate ${notif.handled ? "line-through decoration-success/50" : ""}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.handled && !notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                  )}
                                  {notif.handled && (
                                    <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full shrink-0">
                                      Handled
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">
                                  {notif.body}
                                </p>
                                <p className="text-[10px] text-text-secondary/70 mt-1">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                          {!notif.handled && (
                            <div className="mt-2 ml-7">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsHandled(notif._id);
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold text-success hover:text-success/80 bg-success/10 hover:bg-success/20 px-2 py-1 rounded-md transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Mark as handled
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-border bg-bg text-center">
                      <button
                          onClick={() => {
                            closeDropdown();
                            navigate(
                              notifications[0]?.type === "support" && notifications.every((n) => n.type === "support")
                                ? "/admin?tab=support"
                                : "/admin?tab=orders"
                            );
                          }}
                        className="text-xs font-bold text-primary hover:text-primary-light transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desktop: Profile / Login + Order Now */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-primary hover:bg-surface transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">
                      {user.userName || user.email || "Profile"}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-primary hover:bg-surface transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-on-primary text-sm font-semibold hover:bg-primary-light transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span>Order Now</span>
              </Link>
            </div>

            {/* Mobile: Hamburger */}
            <button
              onClick={toggleMenu}
              type="button"
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="md:hidden bg-bg border-b border-border px-4 pt-2 pb-5 space-y-2 shadow-lg">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-surface hover:text-primary"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
          <div className="pt-2 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-bg text-text font-semibold border border-border shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-error/10 text-error font-semibold border border-error/20 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-bg text-text font-semibold border border-border shadow-sm"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
            <Link
              to="/menu"
              onClick={closeMenu}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-on-primary font-semibold shadow-sm"
            >
              <span>Order Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* Foreground Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-[100] max-w-sm w-full bg-surface border border-border rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text">{toast.title}</p>
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                {toast.body}
              </p>
            </div>
            <button
              onClick={dismissToast}
              className="p-1 rounded-lg text-text-secondary hover:text-text transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
