import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Calendar, ShieldCheck, LogOut, ArrowLeft, Package, BookOpen, Loader2, UtensilsCrossed, Ban, Pencil, X, Check, CalendarDays, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FORBIDDEN_FOOD_OPTIONS } from '../data/foodPreferences';

const GOAL_LABELS = {
  weight_loss: 'Weight Loss',
  maintenance: 'Maintenance',
  bulking: 'Bulking',
};

const DAY_ORDER = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const formatProfileDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, loading: authLoading } = useAuth();
  const [editingFoods, setEditingFoods] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [savingFoods, setSavingFoods] = useState(false);
  const [foodsError, setFoodsError] = useState('');
  const [foodsSaved, setFoodsSaved] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg text-text py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-text-secondary">Loading profile...</p>
      </div>
    );
  }

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const forbiddenFoods = Array.isArray(user.forbiddenFoods) ? user.forbiddenFoods : [];

  const startEditingFoods = () => {
    setSelectedFoods(forbiddenFoods);
    setFoodsError('');
    setFoodsSaved(false);
    setEditingFoods(true);
  };

  const cancelEditingFoods = () => {
    setEditingFoods(false);
    setSelectedFoods([]);
    setFoodsError('');
  };

  const toggleFood = (value) => {
    setSelectedFoods((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const saveForbiddenFoods = async () => {
    setSavingFoods(true);
    setFoodsError('');
    try {
      await updateProfile({ forbiddenFoods: selectedFoods });
      setEditingFoods(false);
      setFoodsSaved(true);
      setTimeout(() => setFoodsSaved(false), 3000);
    } catch (err) {
      setFoodsError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSavingFoods(false);
    }
  };

  const fullName = user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Rock Diet User';

  const weeklyMeals = Array.isArray(user.weeklyMeals)
    ? [...user.weeklyMeals].sort(
        (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
      )
    : [];
  const totalPlanMeals = weeklyMeals.reduce((sum, d) => sum + (d.meals?.length || 0), 0);
  const planTotals = weeklyMeals.reduce(
    (acc, d) => {
      d.meals?.forEach((m) => {
        acc.calories += m.calories || 0;
        acc.protein += m.protein || 0;
        acc.carbs += m.carbs || 0;
        acc.fats += m.fats || 0;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const now = new Date();
  const subDaysLeft =
    user.subscriptionEnd != null
      ? Math.max(0, Math.ceil((new Date(user.subscriptionEnd) - now) / 86400000))
      : null;
  const subscriptionActive =
    user.subscriptionEnd != null && new Date(user.subscriptionEnd) > now;

  const planExpired =
    weeklyMeals.length > 0 &&
    user.weeklyMealsExpiresAt &&
    new Date(user.weeklyMealsExpiresAt) < now;

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Age & Gender</p>
                <p className="text-sm font-semibold text-text mt-0.5 capitalize">
                  {user.age ? `${user.age} yrs` : '—'} · {user.gender || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Health & Diet Metrics Section */}
          {(user.weight || user.calories) && (
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">Daily Macro & Calorie Targets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-bg border border-border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase">Daily Calories</span>
                  <p className="text-lg font-extrabold text-primary mt-0.5">{user.calories ? `${user.calories} kcal` : '—'}</p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-protein uppercase">Protein Target</span>
                  <p className="text-lg font-extrabold text-protein mt-0.5">{user.protein ? `${user.protein}g` : '—'}</p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-carbs uppercase">Carbs Target</span>
                  <p className="text-lg font-extrabold text-carbs mt-0.5">{user.carbs ? `${user.carbs}g` : '—'}</p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-fat uppercase">Fats Target</span>
                  <p className="text-lg font-extrabold text-fat mt-0.5">{user.fats ? `${user.fats}g` : '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs text-text-secondary">
                <div className="bg-bg/50 px-3 py-2 rounded-lg border border-border">
                  <strong>Body Weight:</strong> {user.weight ? `${user.weight} kg` : '—'}
                </div>
                <div className="bg-bg/50 px-3 py-2 rounded-lg border border-border">
                  <strong>Height:</strong> {user.height ? `${user.height} cm` : '—'}
                </div>
                <div className="bg-bg/50 px-3 py-2 rounded-lg border border-border">
                  <strong>Calculated BMI:</strong> {user.BMI || '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Window */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">My Subscription</h3>
                <p className="text-xs text-text-secondary">
                  Your plan window and renewal dates.
                </p>
              </div>
            </div>

            {user.subscriptionEnd != null && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  subscriptionActive
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-error/10 text-error border border-error/30'
                }`}
              >
                {subscriptionActive
                  ? `Active · ${subDaysLeft} day${subDaysLeft === 1 ? '' : 's'} left`
                  : 'Expired'}
              </span>
            )}
          </div>

          {user.package || user.subscriptionEnd != null ? (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {user.package && (
                  <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                    {user.package}
                  </span>
                )}
                {user.goal && (
                  <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold capitalize">
                    {GOAL_LABELS[user.goal] || user.goal.replace(/_/g, ' ')}
                  </span>
                )}
                {user.duration && (
                  <span className="px-3 py-1.5 rounded-full bg-bg text-text-secondary border border-border text-xs font-semibold">
                    {user.duration} week{user.duration === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-bg border border-border rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                    Start Date
                  </p>
                  <p className="text-sm font-extrabold text-text mt-1">
                    {formatProfileDate(user.subscriptionStart)}
                  </p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                    End Date
                  </p>
                  <p className="text-sm font-extrabold text-text mt-1">
                    {formatProfileDate(user.subscriptionEnd)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-secondary italic">
              No subscription yet — pick a plan to get started.
            </p>
          )}
        </div>

        {/* Weekly Meal Plan */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">My Weekly Meal Plan</h3>
                <p className="text-xs text-text-secondary">
                  {totalPlanMeals > 0
                    ? `${totalPlanMeals} planned meal${totalPlanMeals === 1 ? '' : 's'} this week`
                    : 'Assigned by your coach.'}
                </p>
              </div>
            </div>

            {user.weeklyMealsExpiresAt && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  planExpired
                    ? 'bg-error/10 text-error border border-error/30'
                    : 'bg-success/10 text-success border border-success/30'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {planExpired ? 'Expired' : `Until ${formatProfileDate(user.weeklyMealsExpiresAt)}`}
              </span>
            )}
          </div>

          {weeklyMeals.length > 0 ? (
            <>
              {planTotals.calories > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    {Math.round(planTotals.calories)} kcal / week
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-protein/10 text-protein text-xs font-semibold">
                    {Math.round(planTotals.protein)}g Protein
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-carbs/10 text-carbs text-xs font-semibold">
                    {Math.round(planTotals.carbs)}g Carbs
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-fat/10 text-fat text-xs font-semibold">
                    {Math.round(planTotals.fats)}g Fats
                  </span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {weeklyMeals.map((dayEntry) => (
                  <div
                    key={dayEntry.day}
                    className={`rounded-xl border p-4 ${
                      dayEntry.meals?.length > 0
                        ? 'border-border bg-bg'
                        : 'border-border/60 bg-bg/50'
                    }`}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-2.5">
                      {dayEntry.day}
                    </p>
                    {dayEntry.meals?.length > 0 ? (
                      <div className="space-y-2">
                        {dayEntry.meals.map((meal, idx) => (
                          <div
                            key={`${dayEntry.day}-${idx}`}
                            className="bg-surface border border-border rounded-lg px-3 py-2"
                          >
                            <p className="text-xs font-bold text-text leading-snug">
                              {meal.name ||
                                meal.productId?.name ||
                                'Custom meal'}
                            </p>
                            {meal.calories > 0 && (
                              <p className="text-[10px] font-semibold text-text-secondary mt-0.5">
                                {meal.calories} kcal · P {meal.protein || 0}g · C{' '}
                                {meal.carbs || 0}g · F {meal.fats || 0}g
                              </p>
                            )}
                            {meal.notes && (
                              <p className="text-[10px] italic text-text-secondary mt-1 leading-snug">
                                “{meal.notes}”
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-secondary italic">Rest day</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-text-secondary italic">
              No meal plan assigned yet — your coach will set one up for you.
            </p>
          )}
        </div>

        {/* Food Preferences (Forbidden Foods) */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text">Food Preferences</h3>
                <p className="text-xs text-text-secondary">
                  Tell us what you avoid — we keep it off your plate.
                </p>
              </div>
            </div>

            {!editingFoods && (
              <button
                onClick={startEditingFoods}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-bg text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {editingFoods ? (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {FORBIDDEN_FOOD_OPTIONS.map((food) => {
                  const isSelected = selectedFoods.includes(food.value);
                  return (
                    <button
                      key={food.value}
                      type="button"
                      onClick={() => toggleFood(food.value)}
                      aria-pressed={isSelected}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-error/10 text-error border-error/40'
                          : 'bg-bg text-text-secondary border-border hover:border-error/40 hover:text-error'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      {food.label}
                    </button>
                  );
                })}
              </div>

              {foodsError && (
                <p className="text-xs font-semibold text-error mb-3">{foodsError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={saveForbiddenFoods}
                  disabled={savingFoods}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingFoods ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {savingFoods ? 'Saving...' : 'Save Preferences'}
                </button>
                <button
                  onClick={cancelEditingFoods}
                  disabled={savingFoods}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-error transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {foodsSaved && (
                <p className="text-xs font-semibold text-success mb-3">
                  Preferences saved successfully.
                </p>
              )}
              {forbiddenFoods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {forbiddenFoods.map((value) => {
                    const food = FORBIDDEN_FOOD_OPTIONS.find((f) => f.value === value);
                    return (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 text-error border border-error/30 text-xs font-semibold"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {food?.label || value}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-secondary italic">
                  No forbidden foods selected yet.
                </p>
              )}
            </>
          )}
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