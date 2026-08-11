import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  BookOpen,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  User,
  LogOut,
} from "lucide-react";
import rockDietLogo from "../assets/rock-diet-logo.png";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Menu", path: "/menu", icon: BookOpen },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group focus:outline-none"
          >
            <img
              src={rockDietLogo}
              alt="Rock Diet"
              className="h-13 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-3">
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

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-3">
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
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:text-primary hover:bg-surface transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </>
            )}
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-on-primary text-sm font-semibold hover:bg-primary-light transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <span>Order Now</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface focus:outline-none transition-colors"
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
    </header>
  );
}
