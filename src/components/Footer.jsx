import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import rockDietLogo from '../assets/rock-diet-logo.png';
import { useT } from '../i18n/useT';

export default function Footer() {
  const { t, L } = useT();
  return (
    <footer className="bg-bg border-t border-border text-text-secondary text-sm py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={rockDietLogo} alt={t('appName')} className="h-9 w-auto object-contain" />
            </Link>
            <p className="text-xs text-text-secondary leading-relaxed">{t('footerBlurb')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/" className="hover:text-primary transition-colors">{t('navHome')}</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">{t('navMenu')}</Link></li>
              <li><Link to="/orders" className="hover:text-primary transition-colors">{t('navOrders')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">{t('dietPlans')}</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/menu" className="hover:text-primary transition-colors">{t('catHealthyBowls')}</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">{t('catHighProtein')}</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">{t('catKeto')}</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">{t('catDetox')}</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">{t('whyRockDiet')}</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <Truck className="w-4 h-4 text-primary" />{t('fast25Delivery')}</div>
              <div className="flex items-center gap-2 text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-primary" />{t('footerOrganic')}</div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-4 h-4 text-primary" /> 24/7 Support
              </div>
            </div>
          </div>
        </div>

   
          <p className="text-center text-xs text-text-secondary py-10">
            © {new Date().getFullYear()} {t('appName')}. {t('footerRights')}
          </p>
        
      </div>
    </footer>
  );
}
