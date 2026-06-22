import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusBadge } from '@/lib/utils';
import { Package, Users, ShoppingBag, DollarSign, Clock, AlertTriangle, TrendingUp, Loader2, AlertCircle, Eye } from 'lucide-react';
import type { DashboardStats, Order } from '@/types';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin/dashboard/');
            setStats(data);
        } catch {
            setError('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchDashboard} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );
    if (!stats) return null;

    const kpis = [
        { label: 'Total Products', value: stats.total_products, icon: Package, color: 'bg-blue-500' },
        { label: 'Total Users', value: stats.total_users, icon: Users, color: 'bg-green-500' },
        { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: 'bg-yellow-500' },
        { label: 'Total Revenue', value: formatCurrency(stats.total_revenue), icon: DollarSign, color: 'bg-cyan-500' },
        { label: 'Total Profit', value: stats.total_profit ? formatCurrency(stats.total_profit) : 'PKR 0', icon: TrendingUp, color: 'bg-emerald-500' },
        { label: 'Pending Orders', value: stats.pending_orders, icon: Clock, color: 'bg-orange-500' },
        { label: 'Pending Payments', value: stats.pending_payments, icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'Low Stock Items', value: stats.low_stock, icon: Package, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <button onClick={fetchDashboard} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Refresh</button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                            <kpi.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                        <h2 className="font-semibold text-gray-900">Recent Orders</h2>
                    </div>
                    <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                                <th className="text-left py-3 px-2 font-medium text-gray-500">Customer</th>
                                <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-2 font-medium text-gray-500">Payment</th>
                                <th className="text-right py-3 px-2 font-medium text-gray-500">Total</th>
                                <th className="text-center py-3 px-2 font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.recent_orders || []).map((order: Order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-2 font-medium text-gray-900">#{order.id}</td>
                                    <td className="py-3 px-2">{order.user_name || `User #${order.user}`}</td>
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
                                    <td className="py-3 px-2 text-right font-medium">{formatCurrency(order.total)}</td>
                                    <td className="py-3 px-2 text-center">
                                        <Link to={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                                            <Eye className="w-3.5 h-3.5" /> View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!stats.recent_orders || stats.recent_orders.length === 0) && (
                                <tr><td colSpan={6} className="py-6 text-center text-gray-400">No orders yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link to="/admin/products" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        <Package className="w-4 h-4" /> Manage Products
                    </Link>
                    <Link to="/admin/orders" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                        <ShoppingBag className="w-4 h-4" /> View Orders
                    </Link>
                    <Link to="/admin/users" className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                        <Users className="w-4 h-4" /> Manage Users
                    </Link>
                </div>
            </div>
        </div>
    );
}