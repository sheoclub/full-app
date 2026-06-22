import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Image, Megaphone, MessageSquare, Search, Settings, BarChart3, TrendingUp, ChevronDown, Menu, X, LogOut, Star, Truck, Ticket, ShieldCheck, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const sidebarLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/categories', icon: ShoppingBag, label: 'Categories' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/orders/create', icon: PlusCircle, label: 'Create Order' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/banners', icon: Image, label: 'Banners' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/reviews', icon: Star, label: 'Reviews' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Contact Messages' },
    { to: '/admin/payments', icon: ShieldCheck, label: 'Payments' },
    { to: '/admin/delivery-charges', icon: Truck, label: 'Delivery Charges' },
    { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
    { to: '/admin/seo', icon: Search, label: 'SEO' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
];

export default function AdminLayout() {
    const { pathname } = useLocation();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (link: typeof sidebarLinks[0]) => {
        if (link.end) return pathname === link.to;
        return pathname.startsWith(link.to);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-4 border-b border-gray-800">
                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">SC</span>
                        </div>
                        <span className="font-bold">Admin Panel</span>
                    </Link>
                </div>
                <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 70px)' }}>
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(link) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b sticky top-0 z-30">
                    <div className="flex items-center justify-between px-4 h-16">
                        <button
                            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-4 ml-auto">
                            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                View Site
                            </Link>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Hi, {user?.username || 'Admin'}</span>
                                <button
                                    onClick={logout}
                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}