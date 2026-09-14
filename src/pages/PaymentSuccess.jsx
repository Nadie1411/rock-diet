import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Home, ShoppingBag, ArrowRight, Loader2, XCircle } from "lucide-react";
import { orderService } from "../services/orderService";
import { useT } from '../i18n/useT';

export default function PaymentSuccess() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // One return URL serves every purchase, and it carries nothing saying
    // what was bought. A subscription needs the screen that waits for the
    // package to be applied, not the basket receipt — checkout marks which
    // one this was on the way out.
    let wasSubscription = false;
    try {
      wasSubscription = sessionStorage.getItem("pending_subscription") === "1";
    } catch {
      wasSubscription = false;
    }
    if (wasSubscription) {
      navigate("/subscription/success", { replace: true });
      return;
    }

    // The gateway returns to a fixed success URL with no order identifier on
    // it, so the id comes from what checkout stashed before redirecting. An
    // orderId query parameter still wins if the gateway is ever configured to
    // send one.
    let orderId = searchParams.get("orderId");
    if (!orderId) {
      try {
        orderId = sessionStorage.getItem("pending_order_id");
      } catch {
        orderId = null;
      }
    }

    if (!orderId) {
      setVerifying(false);
      setVerified(false);
      return;
    }

    orderService
      .reconcilePayment(orderId)
      .then((res) => {
        const order = res.data || res;
        // Reconciliation answers with the order as it now stands. Only "paid"
        // counts as confirmed — "pending" means the gateway has not settled it
        // yet, and the customer should not be told it went through.
        setVerified(order?.paymentStatus === "paid");
        setPaymentInfo(order);
        try {
          sessionStorage.removeItem("pending_order_id");
        } catch {
          // Nothing to clean up if storage is unavailable.
        }
      })
      .catch(() => {
        setVerified(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!verifying) {
      const timer = setTimeout(() => navigate("/"), 8000);
      return () => clearTimeout(timer);
    }
  }, [verifying, navigate]);

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-6">
        {verifying ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/30">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('verifyingPayment')}</h1>
              <p className="text-sm text-text-secondary">{t('confirmingPayment')}</p>
            </div>
          </>
        ) : verified ? (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentSuccessful')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentSuccessBody')}</p>
              {paymentInfo?.paymentMethod && (
                <p className="text-xs text-text-secondary">
                  Payment method: {paymentInfo.paymentMethod}
                </p>
              )}
            </div>
            <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-4 py-2.5">{t('redirecting8s')}</p>
            <div className="space-y-2.5 pt-2">
              <Link
                to="/orders"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />{t('trackYourOrder')}</Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
              >
                <Home className="w-4 h-4" />{t('checkoutBackHome')}<ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
              <Loader2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">{t('paymentPending')}</h1>
              <p className="text-sm text-text-secondary">{t('paymentPendingBody')}</p>
            </div>
            <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-4 py-2.5">{t('redirecting8s')}</p>
            <div className="space-y-2.5 pt-2">
              <Link
                to="/orders"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />{t('trackYourOrder')}</Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
              >
                <Home className="w-4 h-4" />{t('checkoutBackHome')}<ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
