import { Link } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { useT } from '../i18n/useT';

const NotFound = () => {
  const { t, L } = useT();
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center">
            <SearchX className="w-10 h-10 text-primary" />
          </div>
        </div>

        <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">{t('error404')}</p>

        <h1 className="text-5xl md:text-6xl font-extrabold text-text mb-4">{t('pageNotFound')}</h1>

        <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8">{t('notFoundBody')}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />{t('checkoutBackHome')}</Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface text-text font-semibold hover:bg-bg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />{t('goBack')}</button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;