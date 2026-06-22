import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusBadge, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/utils';
import { ShoppingBag, Loader2, AlertCircle, Eye, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string> = {};
            if (orderStatus) params.order_status = orderStatus;
            if (paymentStatus) params.payment_status = paymentStatus;
            const { data } = await api.get('/admin/orders/', { params });
            setOrders(data);
        } catch {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [orderStatus, paymentStatus]);

    const handleDelete = async (orderId: number) => {
        if (!window.confirm(`Are you sure you want to delete order #${orderId}?\n\nThis will reverse stock and coupon usage.`)) return;
        setDeleting(orderId);
        try {
            await api.delete(`/admin/orders/${orderId}/delete/`);
            toast.success(`Order #${orderId} deleted successfully`);
            fetchOrders();
        } catch {
            toast.error('Failed to delete order');
        } finally {
            setDeleting(null);
        }
    };

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchOrders} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-yellow-600" /> Orders
                </h1>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 mr-1">Filters:</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">All Order Status</option>
                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">All Payment Status</option>
                    {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-500 self-center ml-auto">
                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Order Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500">Discount</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">#{order.id}</td>
                                    <td className="py-3 px-4">{order.user_name || `User #${order.user}`}</td>
                                    <td className="py-3 px-4 text-gray-600 capitalize">{order.payment_method}</td>
                                    <td className="py-3 px-4">
                                        <span className={getStatusBadge(order.order_status, 'order').className}>
                                            {getStatusBadge(order.order_status, 'order').label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={getStatusBadge(order.payment_status, 'payment').className}>
                                            {getStatusBadge(order.payment_status, 'payment').label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {order.discount_amount && parseFloat(order.discount_amount) > 0 ? (
                                            <span className="text-green-600 font-medium">-{formatCurrency(order.discount_amount)} {order.coupon_code && <span className="text-xs uppercase">({order.coupon_code})</span>}</span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(order.created_at)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                disabled={deleting === order.id}
                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                {deleting === order.id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr><td colSpan={9} className="py-10 text-center text-gray-400">No orders found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}