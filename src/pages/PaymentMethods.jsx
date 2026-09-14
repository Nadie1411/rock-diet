import { Link } from 'react-router-dom';
import {
  Lock,
  CreditCard,
  Wallet,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useT } from '../i18n/useT';

/**
 * How you pay.
 *
 * There is nothing to manage here and that is the point: no card is stored,
 * by this app or by the server. Payment is taken on the gateway's own page,
 * so the honest version of a "payment methods" screen is an explanation
 * rather than a list — the same thing the app shows.
 */
export default function PaymentMethods() {
  const { t, L } = useT();
  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-5"
        >
          <ArrowLeft className="w-4 h-4" />{t('navProfile')}</Link>

        <h1 className="text-2xl font-extrabold mb-6">{t('payHowTitle')}</h1>

        <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface mb-4">
          <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary leading-relaxed">{t('paymentSecureNote')}</p>
        </div>

        <div className="space-y-3">
          <Method
            Icon={Wallet}
            title="KNET"
            body="Pay from your Kuwaiti bank account."
          />
          <Method
            Icon={CreditCard}
            title={t('payHowCard')}
            body="Visa or Mastercard, entered on the payment page."
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 mt-4">
          <h2 className="flex items-center gap-2 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-success" />{t('payHowCashTitle')}</h2>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{t('paymentNothingStored')}</p>
        </div>

        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-border mt-4">
          <p className="text-sm text-text-secondary">{t('payHowReceipts')}</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline shrink-0"
          >{t('payHowSeeOrders')}<ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Method({ Icon, title, body }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface">
      <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </span>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-sm text-text-secondary mt-0.5">{body}</p>
      </div>
    </div>
  );
}
