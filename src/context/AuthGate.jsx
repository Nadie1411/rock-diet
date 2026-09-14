import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuth } from './AuthContext';
import AuthModal from '../components/AuthModal';

/**
 * Signing in without losing what you were doing.
 *
 * A guest browses the whole site. Nothing asks who they are until something
 * genuinely cannot be done anonymously — adding to a basket, ordering a
 * bundle — and then it asks in place instead of throwing the page away and
 * sending them to /login, where the thing they wanted is forgotten and they
 * have to find it again.
 *
 * The interrupted action is held and replayed once they are in, so the button
 * they pressed does what they pressed it for.
 */
const AuthGateContext = createContext(null);

export function AuthGateProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const pending = useRef(null);

  // Read through a ref, never through the closure.
  //
  // The action being replayed was built during the signed-out render, so the
  // `requireAuth` captured inside it still saw `isAuthenticated === false`.
  // Replaying it re-opened the sheet the sign-in had just satisfied — the
  // button appeared to do nothing, twice. A ref is always the live value, so
  // the replay proceeds.
  const authed = useRef(isAuthenticated);
  authed.current = isAuthenticated;

  /**
   * Run `action` if they are signed in; otherwise ask, then run it.
   *
   * `reason` is shown at the top of the sheet — "Sign in to add this to your
   * basket" reads as a step in what they were already doing, where a bare
   * "Sign in" reads as an obstacle.
   */
  const requireAuth = useCallback((action, opts = {}) => {
    // Returns true and does nothing else: the caller carries straight on with
    // the code after the guard. `action` is *only* the replay for after a
    // sign-in — running it here as well would re-enter this function through
    // the caller's own guard and recurse until the stack gave out.
    if (authed.current) return true;

    pending.current = action || null;
    setReason(opts.reason || '');
    setOpen(true);
    return false;
  }, []);

  // Replayed from an effect rather than from the login handler, so it waits
  // for the app to actually be in the signed-in state. Calling it straight
  // after `login()` resolves would run it against contexts that had not
  // re-rendered yet, and the cart would refuse it for not being logged in —
  // the very thing the sheet just fixed.
  useEffect(() => {
    if (!isAuthenticated) return;
    setOpen(false);
    const action = pending.current;
    pending.current = null;
    // After the commit, so every provider above this one has re-rendered
    // before the replayed action calls into them.
    if (action) setTimeout(action, 0);
  }, [isAuthenticated]);

  const close = useCallback(() => {
    // Dropped deliberately: they chose not to sign in, so the action they
    // were part-way through should not fire behind them later.
    pending.current = null;
    setOpen(false);
  }, []);

  return (
    <AuthGateContext.Provider value={{ requireAuth, openAuth: setOpen }}>
      {children}
      {open && <AuthModal reason={reason} onClose={close} />}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error('useAuthGate must be used inside AuthGateProvider');
  }
  return ctx;
}
