import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusBadge, getImageUrl, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '@/lib/utils';
import { ArrowLeft, Loader2, AlertCircle, Save, ShoppingBag, Truck, CreditCard, FileText, User, X, MapPin, Phone, Globe, Mail, Printer, Trash2 } from 'lucide-react';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

export default function AdminOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [originalPaidAmount, setOriginalPaidAmount] = useState('');
    const [deleting, setDeleting] = useState(false);


    useEffect(() => { fetchOrder(); }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get(`/admin/orders/${id}/`);
            setOrder(data);
            setOrderStatus(data.order_status);
            setPaymentStatus(data.payment_status);
            setTrackingNumber(data.tracking_number || '');
            setNotes(data.notes || '');
            setPaidAmount(data.paid_amount || '');
            setOriginalPaidAmount(data.paid_amount || '');

        } catch {
            setError('Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: Record<string, any> = {
                status: orderStatus,
                payment_status: paymentStatus,
                tracking_number: trackingNumber,
                notes,
            };
            if (paidAmount !== originalPaidAmount) payload.paid_amount = paidAmount;
            const { data } = await api.post(`/admin/orders/${id}/status/`, payload);
            setOrder(data);
            setOrderStatus(data.order_status);
            setPaymentStatus(data.payment_status);
            setTrackingNumber(data.tracking_number || '');
            setNotes(data.notes || '');
            setPaidAmount(data.paid_amount || '');
            setOriginalPaidAmount(data.paid_amount || '');
            toast.success('Order updated');
        } catch {
            toast.error('Failed to update order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete order #${id}?\n\nThis will reverse stock and coupon usage. This action cannot be undone.`)) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/orders/${id}/delete/`);
            toast.success(`Order #${id} deleted successfully`);
            navigate('/admin/orders');
        } catch {
            toast.error('Failed to delete order');
            setDeleting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchOrder} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );
    if (!order) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/admin/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                <span className={getStatusBadge(order.order_status, 'order').className}>{getStatusBadge(order.order_status, 'order').label}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Details & Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Shipping Info */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Customer & Shipping</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{order.user_name || `User #${order.user}`}</span>
                                </div>
                                {order.user_email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{order.user_email}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{order.phone}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="font-medium">{order.shipping_address}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">{order.city}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-2 font-medium text-gray-500">Product</th>
                                        <th className="text-right py-2 px-2 font-medium text-gray-500">Price</th>
                                        <th className="text-center py-2 px-2 font-medium text-gray-500">Qty</th>
                                        <th className="text-right py-2 px-2 font-medium text-gray-500">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="py-2 px-2 flex items-center gap-2">
                                                <img src={getImageUrl(item.product_image)} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                                <span className="font-medium text-gray-900">{item.product_name}</span>
                                            </td>
                                            <td className="py-2 px-2 text-right">{formatCurrency(item.price)}</td>
                                            <td className="py-2 px-2 text-center">{item.quantity}</td>
                                            <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="py-2 px-2 text-right text-gray-500">Subtotal</td>
                                        <td className="py-2 px-2 text-right font-medium">{formatCurrency(order.subtotal)}</td>
                                    </tr>
                                    {order.discount_amount && parseFloat(order.discount_amount) > 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-2 px-2 text-right text-gray-500">Discount {order.coupon_code ? <span className="text-green-600 uppercase">({order.coupon_code})</span> : ''}</td>
                                            <td className="py-2 px-2 text-right font-medium text-green-600">-{formatCurrency(order.discount_amount)}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={3} className="py-2 px-2 text-right font-semibold text-gray-900">Total</td>
                                        <td className="py-2 px-2 text-right font-bold text-gray-900">{formatCurrency(order.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Payment</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500">Method:</span>
                                <span className="font-medium ml-1">{PAYMENT_METHODS[order.payment_method] || order.payment_method}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <span className={getStatusBadge(order.payment_status, 'payment').className + ' ml-1'}>
                                    {getStatusBadge(order.payment_status, 'payment').label}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Update Form */}
                <div className="space-y-6">
                    <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-900">Update Order</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                            <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <CreditCard className="w-3.5 h-3.5 inline mr-1" /> Paid Amount
                            </label>
                            <input type="text" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Truck className="w-3.5 h-3.5 inline mr-1" /> Tracking Number
                            </label>
                            <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>

                        <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                            <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>

                    {/* Order Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-5 space-y-2 text-sm">
                        <h3 className="font-semibold text-gray-900 mb-2">Order Info</h3>
                        <div className="flex justify-between"><span className="text-gray-500">Created:</span><span>{formatDateTime(order.created_at)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Shipping:</span><span className="font-medium">{order.city}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Contact:</span><span className="font-medium">{order.phone}</span></div>
                        {order.coupon && <div className="flex justify-between"><span className="text-gray-500">Coupon:</span><span className="font-medium text-green-600">{order.coupon}</span></div>}
                        <a href={`/invoice/${order.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </a>
                    </div>

                    {/* Delete Order Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <h3 className="font-semibold text-red-700">Danger Zone</h3>
                        </div>
                        <p className="text-xs text-gray-500">
                            Deleting this order will reverse stock quantities and coupon usage count.
                            This action cannot be undone.
                        </p>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}