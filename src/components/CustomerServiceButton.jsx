import { Link, useLocation } from "react-router-dom";
import { Headphones } from "lucide-react";
import { useT } from '../i18n/useT';

export default function CustomerServiceButton() {
  const { t, L } = useT();
  const location = useLocation();

  // Sits above the mobile tab bar rather than on top of it: the bar is 54px
  // plus the iOS home indicator, and at bottom-6 this button covered 30px of
  // it, swallowing taps meant for the tabs underneath. z-50 so the stacking
  // is decided here rather than by which happens to render last.
  //
  // Don't render the floating button on the support page itself
  if (location.pathname === "/customer-service") return null;

  return (
    <Link
      to="/customer-service"
      aria-label={t('contactSupport')}
      className="group fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 end-6 z-50 flex items-center gap-2 ps-4 pe-5 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary-light transition-all duration-200 hover:scale-105"
    >
      <Headphones className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline">{t('customerService')}</span>
      <span className="w-2.5 h-2.5 rounded-full bg-warning absolute top-1 end-1 border-2 border-primary animate-pulse group-hover:border-primary-light" />
    </Link>
  );
}
