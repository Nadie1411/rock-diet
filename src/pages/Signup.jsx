import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Calendar, Scale, Ruler, Activity, Target, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import rockDietLogo from '../assets/rock-diet-logo.png';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
    height: '',
    gender: '',
    goal: '',
    activityLevel: 'moderate',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState('kw');
  const countryRef = useRef(null);

  const COUNTRIES = [
    { code: 'kw', flag: '🇰🇼', dial: '+965', name: 'Kuwait' },
    { code: 'sa', flag: '🇸🇦', dial: '+966', name: 'Saudi Arabia' },
    { code: 'ae', flag: '🇦🇪', dial: '+971', name: 'UAE' },
    { code: 'qa', flag: '🇶🇦', dial: '+974', name: 'Qatar' },
    { code: 'bh', flag: '🇧🇭', dial: '+973', name: 'Bahrain' },
    { code: 'om', flag: '🇴🇲', dial: '+968', name: 'Oman' },
    { code: 'eg', flag: '🇪🇬', dial: '+20', name: 'Egypt' },
    { code: 'jo', flag: '🇯🇴', dial: '+962', name: 'Jordan' },
    { code: 'lb', flag: '🇱🇧', dial: '+961', name: 'Lebanon' },
    { code: 'iq', flag: '🇮🇶', dial: '+964', name: 'Iraq' },
    { code: 'sy', flag: '🇸🇾', dial: '+963', name: 'Syria' },
    { code: 'ps', flag: '🇵🇸', dial: '+970', name: 'Palestine' },
    { code: 'ye', flag: '🇾🇪', dial: '+967', name: 'Yemen' },
    { code: 'ly', flag: '🇱🇾', dial: '+218', name: 'Libya' },
    { code: 'tn', flag: '🇹🇳', dial: '+216', name: 'Tunisia' },
    { code: 'dz', flag: '🇩🇿', dial: '+213', name: 'Algeria' },
    { code: 'ma', flag: '🇲🇦', dial: '+212', name: 'Morocco' },
    { code: 'sd', flag: '🇸🇩', dial: '+249', name: 'Sudan' },
    { code: 'so', flag: '🇸🇴', dial: '+252', name: 'Somalia' },
    { code: 'dj', flag: '🇩🇯', dial: '+253', name: 'Djibouti' },
    { code: 'km', flag: '🇰🇲', dial: '+269', name: 'Comoros' },
    { code: 'mr', flag: '🇲🇷', dial: '+222', name: 'Mauritania' },
    { code: 'tr', flag: '🇹🇷', dial: '+90', name: 'Turkey' },
    { code: 'in', flag: '🇮🇳', dial: '+91', name: 'India' },
    { code: 'pk', flag: '🇵🇰', dial: '+92', name: 'Pakistan' },
    { code: 'ph', flag: '🇵🇭', dial: '+63', name: 'Philippines' },
    { code: 'us', flag: '🇺🇸', dial: '+1', name: 'USA' },
    { code: 'gb', flag: '🇬🇧', dial: '+44', name: 'UK' },
  ];

  const selectedCountry = COUNTRIES.find((c) => c.code === phoneCountry) || COUNTRIES[0];

  // Close country dropdown on outside click
  React.useEffect(() => {
    if (!countryOpen) return;
    const handleClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [countryOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.userName || !form.email || !form.phoneNumber || !form.password || !form.confirmPassword || !form.age || !form.weight || !form.height || !form.gender || !form.goal) {
      return 'Please fill in all required profile fields';
    }
    if (form.userName.trim().split(/\s+/).length < 2) {
      return 'Please enter your full name (first and last name)';
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      return 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
    }
    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match';
    }
    if (Number(form.age) < 1 || Number(form.age) > 99) {
      return 'Age must be between 1 and 99';
    }
    if (Number(form.weight) < 1 || Number(form.weight) > 500) {
      return 'Weight must be between 1 and 500 kg';
    }
    if (Number(form.height) < 50 || Number(form.height) > 250) {
      return 'Height must be between 50 and 250 cm';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const data = {
        userName: form.userName.trim(),
        email: form.email.trim(),
        phoneNumber: `${selectedCountry.dial} ${form.phoneNumber.trim()}`,
        password: form.password,
        confirmPassword: form.confirmPassword,
        age: Number(form.age),
        weight: Number(form.weight),
        height: Number(form.height),
        gender: form.gender,
        goal: form.goal,
        activityLevel: form.activityLevel,
        package: 'Free Trial',
        duration: '1 month',
      };
      await signup(data);
      // Navigate to OTP confirmation
      navigate('/confirm-email', { state: { email: data.email } });
    } catch (err) {
      if (err instanceof ApiError) {
        // Handle validation errors from backend
        if (err.data?.error?.length) {
          setError(err.data.error[0].message || 'Validation failed');
        } else {
          setError(err.message || 'Signup failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <img src={rockDietLogo} alt="Rock Diet" className="h-12 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            Create <span className="text-primary">Account</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Join Rock Diet and start your healthy journey.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-start gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="userName" className="block text-xs font-semibold text-text mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  value={form.userName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-xs font-semibold text-text mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative shrink-0" ref={countryRef}>
                  <button
                    type="button"
                    onClick={() => setCountryOpen((p) => !p)}
                    className="flex items-center gap-1.5 w-[110px] px-2.5 py-2.5 rounded-lg bg-bg border border-border text-text text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="text-text-secondary text-[11px]">{selectedCountry.dial}</span>
                    <ChevronDown className="w-3 h-3 text-text-secondary ml-auto" />
                  </button>
                  {countryOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 max-h-52 overflow-y-auto bg-surface border border-border rounded-xl shadow-xl z-50">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setPhoneCountry(c.code);
                            setCountryOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                            c.code === phoneCountry
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-text hover:bg-bg'
                          }`}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-text-secondary ml-auto">{c.dial}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="5512 3456"
                    className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Health & Diet Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="age" className="block text-xs font-semibold text-text mb-1">
                  Age *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="99"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="25"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-text mb-1">
                  Gender *
                </label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary font-medium"
                    required
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="weight" className="block text-xs font-semibold text-text mb-1">
                  Weight (kg) *
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    min="1"
                    max="500"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="height" className="block text-xs font-semibold text-text mb-1">
                  Height (cm) *
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    id="height"
                    name="height"
                    type="number"
                    min="50"
                    max="250"
                    value={form.height}
                    onChange={handleChange}
                    placeholder="175"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="activityLevel" className="block text-xs font-semibold text-text mb-1">
                Activity Level
              </label>
              <select
                id="activityLevel"
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary font-medium"
              >
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
              </select>
            </div>

            <div>
              <label htmlFor="goal" className="block text-xs font-semibold text-text mb-1">
                Fitness Goal *
              </label>
              <div className="relative">
                <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <select
                  id="goal"
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-xs focus:outline-none focus:border-primary font-medium"
                  required
                >
                  <option value="" disabled>Select Fitness Goal</option>
                  <option value="weight_loss">Weight Loss (Deficit -500 kcal)</option>
                  <option value="maintenance">Maintenance (Balanced)</option>
                  <option value="bulking">Bulking (Surplus +300 kcal)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-text-secondary mt-1.5">
                At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (@$!%*?&)
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-text mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-light transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}