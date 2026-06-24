import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import UserLayout from '@/components/layout/UserLayout';
import api from '@/lib/api';
import type { SiteSettings } from '@/types';

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

const DEFAULT_SITE_TITLE = 'Shoe Club Pakistan | Ladies Shoes Online';
const DEFAULT_META_DESCRIPTION = 'Shop stylish ladies shoes online in Pakistan at Shoe Club. Discover heels, sandals, pumps, flats, and everyday footwear with reliable delivery.';
const DEFAULT_META_KEYWORDS = 'ladies shoes, women shoes Pakistan, heels, sandals, pumps, flats, footwear online';
const DEFAULT_SITE_URL = 'https://sheoclub.vercel.app';

interface PageMeta {
  title: string;
  description: string;
}

const pageMeta: Record<string, PageMeta & { titleKey?: string; descriptionKey?: string }> = {
  '/': {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_META_DESCRIPTION,
    titleKey: 'site_title',
    descriptionKey: 'meta_description',
  },
  '/shop': {
    title: 'Shop Ladies Shoes Online | Shoe Club Pakistan',
    description: 'Browse ladies shoes, heels, sandals, pumps, flats, and new arrivals online at Shoe Club Pakistan.',
    titleKey: 'shop_title',
    descriptionKey: 'shop_description',
  },
  '/about': {
    title: 'About Shoe Club Pakistan',
    description: 'Learn about Shoe Club Pakistan and our collection of stylish, comfortable ladies footwear.',
    titleKey: 'about_title',
    descriptionKey: 'about_description',
  },
  '/contact': {
    title: 'Contact Shoe Club Pakistan',
    description: 'Contact Shoe Club Pakistan for orders, returns, delivery questions, and customer support.',
    titleKey: 'contact_title',
    descriptionKey: 'contact_description',
  },
  '/shipping-info': {
    title: 'Shipping Information | Shoe Club Pakistan',
    description: 'Find delivery and shipping information for online shoe orders from Shoe Club Pakistan.',
    titleKey: 'shipping_title',
    descriptionKey: 'shipping_description',
  },
  '/return-policy': {
    title: 'Return Policy | Shoe Club Pakistan',
    description: 'Read Shoe Club Pakistan return policy for eligible 7-day returns, outlet visits, and WhatsApp support.',
    titleKey: 'return_title',
    descriptionKey: 'return_description',
  },
  '/track-order': {
    title: 'Track Your Order | Shoe Club Pakistan',
    description: 'Track your Shoe Club Pakistan order status online with your order details.',
    titleKey: 'track_title',
    descriptionKey: 'track_description',
  },
};

function metaForPath(pathname: string, settings: SiteSettings | null): PageMeta {
  const routeMeta = pageMeta[pathname];
  if (routeMeta) {
    return {
      title: (routeMeta.titleKey ? settings?.[routeMeta.titleKey] : '') || routeMeta.title,
      description: (routeMeta.descriptionKey ? settings?.[routeMeta.descriptionKey] : '') || routeMeta.description,
    };
  }
  if (pathname.startsWith('/product/')) {
    return {
      title: 'Product Detail | Shoe Club Pakistan',
      description: 'View product details, price, sizes, colors, and availability at Shoe Club Pakistan.',
    };
  }
  return {
    title: settings?.site_title || DEFAULT_SITE_TITLE,
    description: settings?.meta_description || DEFAULT_META_DESCRIPTION,
  };
}

function siteOriginFromSettings(settings: SiteSettings | null): string {
  const configuredUrl = settings?.canonical_url || DEFAULT_SITE_URL;
  try {
    return new URL(configuredUrl).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function canonicalForPath(pathname: string, settings: SiteSettings | null): string {
  const cleanPath = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`;
  return `${siteOriginFromSettings(settings)}${cleanPath === '/' ? '/' : cleanPath}`;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialLoading } = useAuthStore();
  const location = useLocation();
  if (initialLoading) return <LoadingSpinner fullPage text="Loading..." />;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initialLoading } = useAuthStore();
  const location = useLocation();
  if (initialLoading) return <LoadingSpinner fullPage text="Loading..." />;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!user?.is_staff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser, isAuthenticated, initialLoading } = useAuthStore();
  const { fetchCart } = useCartStore();
  const location = useLocation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
    fetchCart();
  }, [isAuthenticated, loadUser, fetchCart]);

  useEffect(() => {
    api.get('/settings/')
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, []);

  if (initialLoading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  const currentMeta = metaForPath(location.pathname, settings);
  const canonicalUrl = canonicalForPath(location.pathname, settings);
  const ogTitle = settings?.og_title || currentMeta.title;
  const ogDescription = settings?.og_description || currentMeta.description;

  return (
    <>
      <Helmet>
        <title>{currentMeta.title}</title>
        <meta name="description" content={currentMeta.description} />
        <meta name="keywords" content={settings?.meta_keywords || DEFAULT_META_KEYWORDS} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {settings?.og_image && <meta property="og:image" content={settings.og_image} />}
        <meta name="twitter:card" content={settings?.og_image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        {settings?.og_image && <meta name="twitter:image" content={settings.og_image} />}
      </Helmet>
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
    </>
  );
}
