import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Loader2, Package, MapPin, CreditCard, Calendar,
    ChevronRight, ArrowLeft, FileText, Truck
} from 'lucide-react';
import { OrderDetailSkeleton } from '@/components/ui/Skeleton';
import api from '../../lib/api';
import { formatCurrency, formatDateTime, getImageUrl, getStatusBadge } from '../../lib/utils';
import type { Order } from '../../types';

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/orders/${id}/`)
            .then((res) => setOrder(res.data))
            .catch(() => setError('Order not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <OrderDetailSkeleton />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Package className="w-16 h-16 text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900">{error || 'Order not found'}</h2>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const orderBadge = getStatusBadge(order.order_status, 'order');
    const paymentBadge = getStatusBadge(order.payment_status, 'payment');
    const subtotal = order.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-gray-900 font-medium">Order #{order.id}</span>
                </nav>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                Order #{order.id}
                            </h1>
                            <p className="text-gray-500 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Placed on {formatDateTime(order.created_at)}
                            </p>
                            {order.tracking_number && (
                                <p className="text-gray-500 flex items-center gap-1 mt-1">
                                    <Package className="w-4 h-4" />
                                    Tracking: <span className="font-mono font-medium text-blue-600">{order.tracking_number}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className={orderBadge.className}>{orderBadge.label}</span>
                            <span className={paymentBadge.className}>{paymentBadge.label}</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                Order Items
                            </h2>
                            <div className="divide-y">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                            {(item.variant_size || item.variant_color || item.variant_detail) && (
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                                    {(item.variant_size || item.variant_detail?.size) && <span>Size: {item.variant_size || item.variant_detail?.size}</span>}
                                                    {(item.variant_color || item.variant_detail?.color) && (
                                                        <span className="inline-flex items-center gap-1">
                                                            {(item.variant_color_code || item.variant_detail?.color_code) && <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: item.variant_color_code || item.variant_detail?.color_code }} />}
                                                            Color: {item.variant_color || item.variant_detail?.color}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(Number(item.price) * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                Shipping Address
                            </h2>
                            <div className="text-gray-600 space-y-1">
                                <p className="font-medium text-gray-900">{order.user?.name || order.user?.username || 'Customer'}</p>
                                <p>{order.shipping_address}, {order.city}</p>
                                <p>Phone: {order.phone}</p>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                                Payment Details
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Method</span>
                                    <span className="font-medium text-gray-900 capitalize">{order.payment_method.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={paymentBadge.className}>{paymentBadge.label}</span>
                                </div>
                                {order.transaction_id && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Transaction ID</span>
                                        <span className="font-medium text-gray-900">{order.transaction_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {Number(order.discount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(order.discount)}</span>
                                    </div>
                                )}
                                {order.coupon_code && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Coupon</span>
                                        <span className="uppercase">{order.coupon_code}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                                    <span>{Number(order.shipping_cost) > 0 ? formatCurrency(order.shipping_cost) : <span className="text-green-600">Free</span>}</span>
                                </div>
                                <hr />
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                                {Number(order.paid_amount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Paid Amount</span>
                                        <span>{formatCurrency(order.paid_amount)}</span>
                                    </div>
                                )}
                                {order.payment_status === 'Partial' && (
                                    <div className="flex justify-between text-red-600 font-semibold">
                                        <span>Due Amount</span>
                                        <span>{formatCurrency(order.due_amount || order.total)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
                            {['Online Payment', 'Bank Transfer', 'online'].includes(order.payment_method) && ['Pending', 'Partial'].includes(order.payment_status) && (
                                <Link
                                    to={`/payment/${order.id}`}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Complete Payment
                                </Link>
                            )}
                            <a
                                href={`/invoice/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <FileText className="w-4 h-4" />
                                Print Invoice
                            </a>
                            <Link
                                to="/dashboard"
                                className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </Link>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                Order Timeline
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Order Placed</p>
                                        <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                                    </div>
                                </div>
                                {order.order_status !== 'Pending' && (
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${['Processing', 'Shipped', 'Delivered'].includes(order.order_status)
                                            ? 'bg-blue-600'
                                            : 'bg-gray-300'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 capitalize">{order.order_status}</p>
                                            {order.updated_at && (
                                                <p className="text-xs text-gray-500">{formatDateTime(order.updated_at)}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}