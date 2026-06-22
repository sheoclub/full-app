import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadge } from '@/lib/utils';
import { User, Package, Eye, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { StatsCardSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Order } from '@/types';

export default function DashboardPage() {
    const { user, updateProfile, changePassword } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Profile form
    const [profile, setProfile] = useState({ first_name: '', last_name: '', address: '', city: '', phone: '' });
    const [profileSubmitting, setProfileSubmitting] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                address: user.address || '',
                city: user.city || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/orders/?ordering=-created_at');
            setOrders(data.results || data || []);
        } catch (err: any) {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSubmitting(true);
        try {
            await updateProfile(profile);
            toast.success('Profile updated successfully');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to update profile');
        } finally {
            setProfileSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordForm.old_password || !passwordForm.new_password) {
            toast.error('Please fill in both password fields');
            return;
        }
        if (passwordForm.new_password.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        setPasswordSubmitting(true);
        try {
            await changePassword(passwordForm.old_password, passwordForm.new_password);
            toast.success('Password changed successfully');
            setPasswordForm({ old_password: '', new_password: '' });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to change password');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-500 mt-1">Manage your profile and view your orders</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Section */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">Profile</h2>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={profile.first_name}
                                        onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={profile.last_name}
                                        onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={profile.address}
                                    onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={profile.city}
                                        onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={profileSubmitting}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {profileSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {profileSubmitting ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordChange} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.old_password}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, old_password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={passwordSubmitting}
                                className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {passwordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {passwordSubmitting ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Orders Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="font-semibold text-gray-900">My Orders</h2>
                            </div>
                            <Link
                                to="/shop"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Continue Shopping
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-8 animate-page-enter">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    <StatsCardSkeleton />
                                    <StatsCardSkeleton />
                                    <StatsCardSkeleton />
                                </div>
                                <div className="bg-white rounded-xl border overflow-hidden">
                                    <div className="p-6 space-y-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                                                <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                                                <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
                                                <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
                                                <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                                <p className="text-gray-500">{error}</p>
                                <button
                                    onClick={fetchOrders}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Package className="w-12 h-12 text-gray-300 mb-3" />
                                <h3 className="text-gray-600 font-medium">No orders yet</h3>
                                <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
                                <Link
                                    to="/shop"
                                    className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                                            <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                                            <th className="text-right py-3 px-2 font-medium text-gray-500">Paid</th>
                                            <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                                            <th className="text-center py-3 px-2 font-medium text-gray-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-2 font-medium text-gray-900">#{order.id}</td>
                                                <td className="py-3 px-2">
                                                    <span className={getStatusBadge(order.order_status, 'order').className}>
                                                        {getStatusBadge(order.order_status, 'order').label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium">{formatCurrency(order.total)}</td>
                                                <td className="py-3 px-2 text-right">
                                                    {order.payment_status === 'paid' || order.payment_status === 'Paid'
                                                        ? formatCurrency(order.total)
                                                        : <span className="text-red-500">—</span>
                                                    }
                                                </td>
                                                <td className="py-3 px-2 text-gray-500">{formatDate(order.created_at)}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <Link
                                                        to={`/order/${order.id}`}
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}