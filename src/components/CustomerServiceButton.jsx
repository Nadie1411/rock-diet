import { Link, useLocation } from "react-router-dom";
import { Headphones } from "lucide-react";

export default function CustomerServiceButton() {
  const location = useLocation();

  // Don't render the floating button on the support page itself
  if (location.pathname === "/customer-service") return null;

  return (
    <Link
      to="/customer-service"
      aria-label="Contact Customer Service"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary-light transition-all duration-200 hover:scale-105"
    >
      <Headphones className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline">Customer Service</span>
      <span className="w-2.5 h-2.5 rounded-full bg-warning absolute top-1 right-1 border-2 border-primary animate-pulse group-hover:border-primary-light" />
    </Link>
  );
}
