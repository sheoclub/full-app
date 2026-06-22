import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Heart, MessageSquare, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { pathname } = useLocation();
    const { logout } = useAuthStore();

    const navLinks = [
        { to: '/dashboard', icon: User, label: 'Dashboard' },
        { to: '/my-messages', icon: MessageSquare, label: 'My Messages' },
        { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-56 shrink-0">
                <nav className="bg-white rounded-xl shadow-sm border p-3 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === link.to ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <link.icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    ))}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}