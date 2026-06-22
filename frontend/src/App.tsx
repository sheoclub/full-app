import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import UserLayout from '@/components/layout/UserLayout';

// Public Pages
import HomePage from '@/pages/public/HomePage';
import ShopPage from '@/pages/public/ShopPage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';
import AboutPage from '@/pages/public/AboutPage';
import ContactPage from '@/pages/public/ContactPage';
import ShippingInfoPage from '@/pages/public/ShippingInfoPage';
import ReturnPolicyPage from '@/pages/public/ReturnPolicyPage';
import TrackOrderPage from '@/pages/public/TrackOrderPage';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';

// Cart Pages
import CartPage from '@/pages/cart/CartPage';
import CheckoutPage from '@/pages/cart/CheckoutPage';
import OrderDetailPage from '@/pages/cart/OrderDetailPage';
import PaymentPage from '@/pages/cart/PaymentPage';
import InvoicePage from '@/pages/cart/InvoicePage';

// User Pages
import DashboardPage from '@/pages/user/DashboardPage';
import MyMessagesPage from '@/pages/user/MyMessagesPage';
import MyInboxPage from '@/pages/user/MyInboxPage';
import WishlistPage from '@/pages/user/WishlistPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminCreateOrder from '@/pages/admin/AdminCreateOrder';
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminBanners from '@/pages/admin/AdminBanners';
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements';
import AdminContactMessages from '@/pages/admin/AdminContactMessages';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminReports from '@/pages/admin/AdminReports';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminPayments from '@/pages/admin/AdminPayments';
import AdminDeliveryCharges from '@/pages/admin/AdminDeliveryCharges';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminSEO from '@/pages/admin/AdminSEO';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/shop': 'Shop',
  '/about': 'About',
  '/contact': 'Contact',
  '/shipping-info': 'Shipping Info',
  '/return-policy': 'Return Policy',
  '/track-order': 'Track Order',
  '/login': 'Login',
  '/signup': 'Signup',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/dashboard': 'Dashboard',
  '/my-messages': 'My Messages',
  '/my-inbox': 'My Inbox',
  '/wishlist': 'Wishlist',
  '/admin': 'Admin Dashboard',
  '/admin/products': 'Admin Products',
  '/admin/orders': 'Admin Orders',
  '/admin/orders/create': 'Create Order',
  '/admin/categories': 'Admin Categories',
  '/admin/users': 'Admin Users',
  '/admin/banners': 'Admin Banners',
  '/admin/announcements': 'Admin Announcements',
  '/admin/reviews': 'Admin Reviews',
  '/admin/messages': 'Admin Messages',
  '/admin/settings': 'Admin Settings',
  '/admin/reports': 'Admin Reports',
  '/admin/analytics': 'Admin Analytics',
  '/admin/delivery-charges': 'Delivery Charges',
  '/admin/seo': 'Admin SEO',
  '/admin/payments': 'Admin Payments',
  '/admin/coupons': 'Admin Coupons',
};

function titleForPath(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/product/')) return 'Product Detail';
  if (pathname.startsWith('/order/')) return 'Order Detail';
  if (pathname.startsWith('/payment/')) return 'Payment';
  if (pathname.startsWith('/invoice/')) return 'Invoice';
  if (pathname.startsWith('/admin/orders/')) return 'Admin Order Detail';
  if (pathname.startsWith('/admin/users/')) return 'Admin User Detail';
  return 'Ladies Shoe Club';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initialLoading } = useAuthStore();
  if (initialLoading) return <LoadingSpinner fullPage text="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initialLoading } = useAuthStore();
  if (initialLoading) return <LoadingSpinner fullPage text="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser, isAuthenticated, initialLoading } = useAuthStore();
  const { fetchCart } = useCartStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
      fetchCart();
    }
  }, [isAuthenticated, loadUser, fetchCart]);

  useEffect(() => {
    const pageTitle = titleForPath(location.pathname);
    document.title = pageTitle === 'Ladies Shoe Club' ? pageTitle : `${pageTitle} | Ladies Shoe Club`;
  }, [location.pathname]);

  if (initialLoading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/shipping-info" element={<ShippingInfoPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Cart Routes */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/invoice/:id" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />

        {/* User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><UserLayout><DashboardPage /></UserLayout></ProtectedRoute>} />
        <Route path="/my-messages" element={<ProtectedRoute><UserLayout><MyMessagesPage /></UserLayout></ProtectedRoute>} />
        <Route path="/my-inbox" element={<ProtectedRoute><UserLayout><MyInboxPage /></UserLayout></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      </Route>

      {/* Admin Routes — mount inside PublicLayout for shared header/footer, or standalone AdminLayout */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders/create" element={<AdminCreateOrder />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="messages" element={<AdminContactMessages />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="delivery-charges" element={<AdminDeliveryCharges />} />
        <Route path="seo" element={<AdminSEO />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
