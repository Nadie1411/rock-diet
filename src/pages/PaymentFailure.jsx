import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { XCircle, Home, ShoppingBag, ArrowRight } from "lucide-react";
import { useT } from '../i18n/useT';

export default function PaymentFailure() {
  const { t, L } = useT();
  const navigate = useNavigate();

  // Auto-redirect to home after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => navigate("/"), 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
        {/* Error Icon */}
        <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto border border-error/30">
          <XCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentFailed')}</h1>
          <p className="text-sm text-text-secondary">{t('paymentFailedBody')}</p>
        </div>

        {/* Auto-redirect note */}
        <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-4 py-2.5">{t('redirecting8s')}</p>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Link
            to="/menu"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />{t('tryAgainBrowse')}</Link>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
          >
            <Home className="w-4 h-4" />{t('checkoutBackHome')}<ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}