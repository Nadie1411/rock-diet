import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import rockDietLogo from '../assets/rock-diet-logo.png';

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border text-text-secondary text-sm py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src={rockDietLogo} alt="Rock Diet" className="h-9 w-auto object-contain" />
            </Link>
            <p className="text-xs text-text-secondary leading-relaxed">
              Healthy & delicious gourmet meals tailored to your lifestyle. Freshly prepared and delivered fast.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">Menu</Link></li>
              <li><Link to="/orders" className="hover:text-primary transition-colors">Orders</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">Diet Plans</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/menu" className="hover:text-primary transition-colors">Healthy Bowls</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">High Protein</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">Keto & Low Carb</Link></li>
              <li><Link to="/menu" className="hover:text-primary transition-colors">Detox & Juices</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text mb-4">Why Rock Diet</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-text-secondary">
                <Truck className="w-4 h-4 text-primary" /> Fast 25-Min Delivery
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-primary" /> 100% Organic & Healthy
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-4 h-4 text-primary" /> 24/7 Support
              </div>
            </div>
          </div>
        </div>

   
          <p className="text-center text-xs text-text-secondary py-10">
            © {new Date().getFullYear()} Rock Diet (روك دايت). All rights reserved.
          </p>
        
      </div>
    </footer>
  );
}
