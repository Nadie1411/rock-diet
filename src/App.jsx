import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import MenuItemDetail from './pages/MenuItemDetail';
import Packages from './pages/Packages';
import Subscribe from './pages/Subscribe';
import WeekPlan from './pages/WeekPlan';
import Plan from './pages/Plan';
import ManagePlan from './pages/ManagePlan';
import Restrictions from './pages/Restrictions';
import Notifications from './pages/Notifications';
import Offers from './pages/Offers';
import DeliveryAddress from './pages/DeliveryAddress';
import DailyBox from './pages/DailyBox';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ConfirmEmail from './pages/ConfirmEmail';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import PaymentMethods from './pages/PaymentMethods';
import PaymentFailure from './pages/PaymentFailure';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthGateProvider } from './context/AuthGate';
import { SubscriptionProvider } from './context/SubscriptionContext';
import NotFound from './pages/NotFound';
import CustomerService from './pages/CustomerService';
import AppDownloadBanner from './components/AppDownloadBanner';
import CustomerServiceButton from './components/CustomerServiceButton';
import RequirePlanChoice from './components/RequirePlanChoice';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SubscriptionProvider>
        <CartProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            {/* Inside the router: the sheet links to /signup and
                /forgot-password, and it has to sit above every page so any
                of them can ask for a sign-in in place. */}
            <AuthGateProvider>
            <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-primary selection:text-white font-sans">
              <AppDownloadBanner />
              <Navbar />
              <CartDrawer />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/menu/:id" element={<MenuItemDetail />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route
                    path="/packages"
                    element={<RequirePlanChoice><Packages /></RequirePlanChoice>}
                  />
                  <Route
                    path="/subscribe"
                    element={<RequirePlanChoice><Subscribe /></RequirePlanChoice>}
                  />
                  <Route path="/week-plan" element={<WeekPlan />} />
                  <Route path="/plan" element={<Plan />} />
                  <Route path="/plan/manage" element={<ManagePlan />} />
                  <Route path="/restrictions" element={<Restrictions />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/delivery" element={<DeliveryAddress />} />
                  <Route path="/daily-box" element={<DailyBox />} />
                  <Route path="/orders/:id" element={<OrderTracking />} />
                  <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
                  <Route path="/confirm-email" element={<ConfirmEmail />} />
                  <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  {/* Admin lives in the Next.js panel at /admin, served by the
                      web server outside this app — not a client-side route. */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                  <Route path="/payment-methods" element={<PaymentMethods />} />
                  <Route path="/payment/failure" element={<PaymentFailure />} />
                  <Route path="/customer-service" element={<CustomerService />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <CustomerServiceButton />
              <Footer />

              {/* The app's bottom tab bar, phones only. The spacer keeps the
                  last of the page clear of it. */}
              <div className="md:hidden h-16" aria-hidden="true" />
              <BottomNav />
            </div>
            </AuthGateProvider>
          </Router>
        </NotificationProvider>
        </CartProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;