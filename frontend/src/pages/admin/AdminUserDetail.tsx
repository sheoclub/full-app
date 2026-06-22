import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadge, getImageUrl } from '@/lib/utils';
import { ArrowLeft, Loader2, AlertCircle, User as UserIcon, ShoppingBag, ToggleLeft, ToggleRight, Mail, Phone, MapPin, Shield } from 'lucide-react';
import type { User, Order } from '@/types';
import toast from 'react-hot-toast';

interface UserDetailData {
    user: User;
    orders: Order[];
}

export default function AdminUserDetail() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<UserDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchUser(); }, [id]);

    const fetchUser = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/admin/users/${id}/`);
            setData(data);
        } catch {
            setError('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async () => {
        try {
            const res = await api.post(`/admin/users/${id}/toggle/`);
            toast.success(res.data.message || 'User status updated');
            fetchUser();
        } catch {
            toast.error('Failed to toggle user status');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchUser} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );
    if (!data) return null;

    const { user, orders } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">User #{user.id}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${!user.is_suspended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className={`w-2 h-2 rounded-full ${!user.is_suspended ? 'bg-green-500' : 'bg-red-500'}`} />
                    {!user.is_suspended ? 'Active' : 'Suspended'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - User Details */}
                <div className="space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Profile</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                                    {(user.first_name?.[0] || user.username[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                                    <p className="text-gray-500 text-xs">@{user.username}</p>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-3.5 h-3.5" /> {user.email}
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-3.5 h-3.5" /> {user.phone}
                                    </div>
                                )}
                                {(user.address || user.city) && (
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                        <span>{user.address}{user.city && `, ${user.city}`}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Shield className="w-3.5 h-3.5" />
                                    {user.is_staff ? 'Staff / Admin' : 'Regular User'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
                        <h2 className="font-semibold text-gray-900">Actions</h2>
                        <button
                            onClick={handleToggleActive}
                            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${!user.is_suspended
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            {!user.is_suspended ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {!user.is_suspended ? 'Suspend User' : 'Activate User'}
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
                        <h2 className="font-semibold text-gray-900">Stats</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-blue-700">{user.order_count ?? 0}</p>
                                <p className="text-xs text-blue-600">Orders</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-700">{orders.length}</p>
                                <p className="text-xs text-green-600">Total Orders</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Joined {formatDate(user.date_joined)}</p>
                    </div>
                </div>

                {/* Right - Orders */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Order History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                                        <th className="text-left py-3 px-2 font-medium text-gray-500">Payment</th>
                                        <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
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
                                            <td className="py-3 px-2">
                                                <span className={getStatusBadge(order.payment_status, 'payment').className}>
                                                    {getStatusBadge(order.payment_status, 'payment').label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium">{formatCurrency(order.final_total || order.total)}</td>
                                            <td className="py-3 px-2 text-gray-500 text-xs">{formatDateTime(order.created_at)}</td>
                                            <td className="py-3 px-2 text-center">
                                                <Link to={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={6} className="py-10 text-center text-gray-400">No orders yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}