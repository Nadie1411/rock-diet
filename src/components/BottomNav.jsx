import { NavLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  BookOpen,
  CalendarSync,
  ShoppingBag,
  User,
  Package,
  Tag,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

/**
 * The app's bottom tab bar, on small screens.
 *
 * The app reaches every one of its main areas in one thumb press; the website
 * had them behind a hamburger drawer, which is two presses and hides where
 * you are. Desktop keeps the top bar — a bottom bar there would be a phone
 * pattern on a screen that has no need of it.
 *
 * Destinations mirror the app shell exactly for a signed-in customer. A guest
 * has no plan, orders or profile, so they get the browse-oriented set the
 * website already used.
 */

const SIGNED_IN = [
  { key: 'navHome', path: '/', icon: HomeIcon },
  { key: 'navMenu', path: '/menu', icon: BookOpen },
  { key: 'navPlan', path: '/plan', icon: CalendarSync },
  { key: 'navOrders', path: '/orders', icon: ShoppingBag },
  { key: 'navProfile', path: '/profile', icon: User },
];

const GUEST = [
  { key: 'navHome', path: '/', icon: HomeIcon },
  { key: 'navMenu', path: '/menu', icon: BookOpen },
  { key: 'packagesTitle', path: '/packages', icon: Package },
  { key: 'offersTitle', path: '/offers', icon: Tag },
];

export default function BottomNav() {
  const { isAuthenticated } = useAuth();
  const { t, L } = useT();
  const items = isAuthenticated ? SIGNED_IN : GUEST;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border"
      // Keeps the bar clear of the home indicator on iOS.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                    isActive ? 'text-primary' : 'text-text-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span>{t(item.key)}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
