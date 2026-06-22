import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, ChevronDown, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { SiteSettings } from '@/types';
import { getImageUrl } from '@/lib/utils';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { cart } = useCartStore();
    const { isMobileMenuOpen, toggleMobileMenu, toggleMobileNav, closeMobileMenu } = useUIStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        api.get('/settings/').then(({ data }) => setSettings(data)).catch(() => { });
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
            closeMobileMenu();
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            {/* Top bar */}
            <div className="bg-gray-900 text-white text-xs py-1.5">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <span>{settings?.top_banner_text || 'Free delivery on orders over Rs. 2,000'}</span>
                    <div className="hidden sm:flex items-center gap-4">
                        {isAuthenticated && user?.is_staff && (
                            <Link to="/admin" className="hover:text-gray-300 transition-colors">Admin Panel</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main navbar */}
            <nav className="bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                            {settings?.logo_url ? (
                                <img
                                    src={getImageUrl(settings.logo_url)}
                                    alt={settings?.site_name || 'Shoe Club'}
                                    className="h-10 w-auto object-contain"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">SC</span>
                                </div>
                            )}
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
                                {settings?.site_name || 'Shoe Club'}
                            </span>
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden lg:flex items-center gap-6">
                            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
                            <Link to="/shop" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Shop</Link>
                            <Link to="/track-order" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Track Order</Link>
                            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</Link>
                            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</Link>
                        </div>

                        {/* Search + Actions */}
                        <div className="flex items-center gap-3">
                            {/* Desktop search */}
                            <form onSubmit={handleSearch} className="hidden md:flex items-center">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-48 lg:w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                </div>
                            </form>

                            {/* Cart */}
                            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                                <ShoppingCart className="w-6 h-6" />
                                {cart.item_count > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cart.item_count}
                                    </span>
                                )}
                            </Link>

                            {/* User menu */}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-1 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                                    >
                                        <User className="w-6 h-6" />
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20 animate-scale-in">
                                                <div className="p-3 border-b">
                                                    <p className="font-medium text-sm">{user?.email}</p>
                                                    <p className="text-xs text-gray-500">@{user?.username}</p>
                                                </div>
                                                <div className="py-1">
                                                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Dashboard</Link>
                                                    <Link to="/my-inbox" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Inbox</Link>
                                                    <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Wishlist</Link>
                                                    {user?.is_staff && (
                                                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>Admin Panel</Link>
                                                    )}
                                                </div>
                                                <div className="border-t py-1">
                                                    <button
                                                        onClick={() => { logout(); setShowUserMenu(false); }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                    Login
                                </Link>
                            )}

                            {/* Mobile menu toggle */}
                            <button
                                className="lg:hidden p-2 text-gray-700 hover:text-blue-600"
                                onClick={toggleMobileMenu}
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t animate-fade-in">
                    <div className="px-4 py-3">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" />
                            </div>
                        </form>
                    </div>
                    <div className="px-4 pb-4 space-y-1">
                        <Link to="/" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Home</Link>
                        <Link to="/shop" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Shop</Link>
                        <Link to="/track-order" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Track Order</Link>
                        <Link to="/about" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>About</Link>
                        <Link to="/contact" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Contact</Link>
                        <Link to="/cart" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>
                            Cart {cart.item_count > 0 && `(${cart.item_count})`}
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Dashboard</Link>
                                <Link to="/my-inbox" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Inbox</Link>
                                <Link to="/wishlist" className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={closeMobileMenu}>Wishlist</Link>
                                <button onClick={() => { logout(); closeMobileMenu(); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" className="block px-3 py-2.5 rounded-lg text-blue-600 hover:bg-blue-50 font-medium" onClick={closeMobileMenu}>Login / Sign Up</Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}