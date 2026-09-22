import { Link, useLocation } from "react-router-dom";
import { Headphones } from "lucide-react";
import { useT } from '../i18n/useT';
import { useSupportContact } from '../hooks/useSupportContact';

/**
 * The always-there way to reach a person: a WhatsApp chat.
 *
 * Customers here talk to businesses on WhatsApp, and a chat that opens in
 * one tap beats a form that promises a call. The number comes from the admin
 * panel's settings; while none is configured the button falls back to the
 * call-back page, so it is never a dead end.
 */
export default function CustomerServiceButton() {
  const { t } = useT();
  const location = useLocation();
  const { whatsappUrl } = useSupportContact();

  // Sits above the mobile tab bar rather than on top of it: the bar is 54px
  // plus the iOS home indicator, and at bottom-6 this button covered 30px of
  // it, swallowing taps meant for the tabs underneath. z-50 so the stacking
  // is decided here rather than by which happens to render last.
  //
  // Don't render the floating button on the support page itself
  if (location.pathname === "/customer-service") return null;

  // Pages that pin their own action bar to the bottom on phones — the
  // subscription wizard's Back/Continue, the week plan's Save. This button
  // sat in the same corner, on top of the Continue button, at exactly the
  // moment a customer was trying to pay. There it stays off small screens;
  // support is still one tap away in the menu, and on desktop the bars are
  // not fixed, so nothing changes there.
  const crowded = ["/subscribe", "/week-plan"].some((path) =>
    location.pathname.startsWith(path),
  );

  const className =
    `group fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 end-6 z-50 ${crowded ? "hidden md:flex" : "flex"} items-center gap-2 ps-4 pe-5 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary-light transition-all duration-200 hover:scale-105`;

  const inner = (
    <>
      <Headphones className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline">{t('customerService')}</span>
      <span className="w-2.5 h-2.5 rounded-full bg-warning absolute top-1 end-1 border-2 border-primary animate-pulse group-hover:border-primary-light" />
    </>
  );

  if (whatsappUrl) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('customerService')}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link to="/customer-service" aria-label={t('contactSupport')} className={className}>
      {inner}
    </Link>
  );
}
