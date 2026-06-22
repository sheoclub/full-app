import { useState } from 'react';
import { Package, Search, Truck, Calendar, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadge } from '../../lib/utils';
import api from '../../lib/api';
import type { Order } from '../../types';

export default function TrackOrderPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;
        setLoading(true);
        setError('');
        setOrder(null);
        try {
            const res = await api.get(`/track-order/?tracking_number=${encodeURIComponent(trackingNumber.trim())}`);
            setOrder(res.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('No order found with this tracking number. Please check and try again.');
            } else {
                setError('Failed to track order. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = order ? getStatusBadge(order.order_status, 'order') : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
                    <p className="mt-2 text-gray-600">Enter your tracking number to see the current status of your order.</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number (e.g. SHOE-XXXXXX)"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !trackingNumber.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                            Track Order
                        </button>
                    </div>
                    {error && (
                        <p className="mt-3 text-sm text-red-600">{error}</p>
                    )}
                </form>

                {/* Order Details */}
                {order && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Status Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Order #{order.id}</h2>
                                {statusBadge && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <Package className="w-4 h-4" />
                                <span className="font-mono text-blue-600 font-medium">{order.tracking_number}</span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Date
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        City
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{order.city}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Payment
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{order.payment_method}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <Truck className="w-3.5 h-3.5" />
                                        Status
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{order.order_status}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        <img
                                            src={item.thumbnail || 'https://via.placeholder.com/48'}
                                            alt={item.product_name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(order.subtotal || order.total)}</span>
                                </div>
                                {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order.discount_amount)}</span>
                                    </div>
                                )}
                                {order.shipping_cost && parseFloat(order.shipping_cost) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>{formatCurrency(order.shipping_cost)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}