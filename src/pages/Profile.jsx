import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Calendar, ShieldCheck, LogOut, ArrowLeft, Package, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-bg text-text py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-extrabold text-text mb-4">Not Logged In</h1>
          <p className="text-text-secondary text-sm mb-8">Please login to view your profile.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
          >
            <User className="w-4 h-4" />
            Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const fullName = user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Rock Diet User';

  return (
    <div className="min-h-screen bg-bg text-text py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text">
              My <span className="text-primary">Profile</span>
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-1">
              Manage your account details.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error hover:text-white transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
              {(fullName.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text">{fullName}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider mt-1">
                <ShieldCheck className="w-3 h-3" />
                {user.role || 'User'}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-semibold text-text mt-0.5">{fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-text mt-0.5 break-all">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Age</p>
                <p className="text-sm font-semibold text-text mt-0.5">{user.age ? `${user.age} years` : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="bg-bg border border-border rounded-xl p-5 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center">
              <Package className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">My Orders</h3>
              <p className="text-xs text-text-secondary">Track deliveries and view history</p>
            </div>
          </Link>

          <Link
            to="/menu"
            className="bg-bg border border-border rounded-xl p-5 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">Order Now</h3>
              <p className="text-xs text-text-secondary">Browse the full menu</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}