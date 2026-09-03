import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Home, ShoppingBag, ArrowRight, Loader2, XCircle } from "lucide-react";
import { orderService } from "../services/orderService";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const paymentToken = searchParams.get("paymentToken");

    if (!paymentToken) {
      setVerifying(false);
      setVerified(false);
      return;
    }

    orderService
      .verifyPayment(paymentToken)
      .then((res) => {
        const data = res.data || res;
        setVerified(data.verified === true);
        setPaymentInfo(data);
      })
      .catch(() => {
        setVerified(false);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [searchParams]);

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
              <h1 className="text-2xl font-extrabold text-text tracking-tight">
                Verifying Payment...
              </h1>
              <p className="text-sm text-text-secondary">
                Please wait while we confirm your payment with Ecom.
              </p>
            </div>
          </>
        ) : verified ? (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-sm text-text-secondary">
                Thank you! Your order has been paid and confirmed. Our kitchen is
                already preparing your fresh healthy meals.
              </p>
              {paymentInfo?.paymentMethod && (
                <p className="text-xs text-text-secondary">
                  Payment method: {paymentInfo.paymentMethod}
                </p>
              )}
            </div>
            <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-4 py-2.5">
              Redirecting you to the home page in 8 seconds...
            </p>
            <div className="space-y-2.5 pt-2">
              <Link
                to="/orders"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                Track Your Order
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
              <Loader2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-text tracking-tight">
                Payment Pending
              </h1>
              <p className="text-sm text-text-secondary">
                We received your payment request but it is still being processed.
                Your order will be confirmed shortly. If you have any issues, please contact support.
              </p>
            </div>
            <p className="text-xs text-text-secondary bg-bg border border-border rounded-lg px-4 py-2.5">
              Redirecting you to the home page in 8 seconds...
            </p>
            <div className="space-y-2.5 pt-2">
              <Link
                to="/orders"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                Track Your Order
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-bg transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
