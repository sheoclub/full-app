import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadge, getImageUrl } from '@/lib/utils';
import { ArrowLeft, Loader2, AlertCircle, User, MapPin, Phone, FileText, Printer, Mail, Globe } from 'lucide-react';
import type { Order, SiteSettings } from '@/types';

export default function InvoicePage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get(`/orders/${id}/`);
                setOrder(data);
            } catch {
                try {
                    const { data } = await api.get(`/admin/orders/${id}/`);
                    setOrder(data);
                } catch {
                    setError('Failed to load invoice. Please ensure the order exists and you have access.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings/');
                setSettings(data);
            } catch { /* use default */ }
        };
        fetchSettings();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
                <AlertCircle className="w-16 h-16 text-red-300 mb-4" />
                <p className="text-gray-600 text-center max-w-md">{error}</p>
                <Link to="/dashboard" className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!order) return null;

    const subtotal = parseFloat(order.subtotal || '0');
    const discount = parseFloat(order.discount_amount || '0');
    const shipping = parseFloat(order.shipping_cost || '0');
    const total = parseFloat(order.total || '0');
    const paid = parseFloat(order.paid_amount || '0');
    const due = parseFloat(order.due_amount || '0');
    const orderBadge = getStatusBadge(order.order_status, 'order');
    const paymentBadge = getStatusBadge(order.payment_status, 'payment');

    return (
        <div className="print-container min-h-screen bg-gray-50">
            {/* Toolbar - hidden when printing */}
            <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <Link to={`/order/${order.id}`} className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1.5">
                        <ArrowLeft className="w-4 h-4" /> Back to Order
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Document */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden" id="invoice-content">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 px-8 py-10 sm:px-12">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                {settings?.logo_url ? (
                                    <img
                                        src={getImageUrl(settings.logo_url)}
                                        alt={settings.site_name || 'Shoe Club'}
                                        className="w-16 h-16 rounded-xl object-contain bg-white/20 p-1.5"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-xl font-bold">{(settings?.site_name || 'Shoe Club').charAt(0)}</span>
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{settings?.site_name || 'Shoe Club'}</h1>
                                    <p className="text-purple-200 text-sm mt-0.5">Premium Footwear</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">INVOICE</h2>
                                <p className="text-purple-200 text-sm mt-0.5">#{order.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-200">
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">#{order.id}</p>
                        </div>
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                                {order.tracking_number || <span className="text-gray-400 font-normal">&mdash;</span>}
                            </p>
                        </div>
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</p>
                            <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">{order.payment_method.replace('_', ' ')}</p>
                        </div>
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</p>
                            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${orderBadge.className}`}>
                                {orderBadge.label}
                            </span>
                        </div>
                        <div className="bg-gray-50 px-5 py-4">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</p>
                            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentBadge.className}`}>
                                {paymentBadge.label}
                            </span>
                        </div>
                    </div>

                    {/* Customer & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">
                        <div className="bg-white px-8 py-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Customer Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p className="font-semibold text-gray-900">{order.user_name || `User #${order.user}`}</p>
                                {order.user_email && (
                                    <p className="text-gray-600 flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        {order.user_email}
                                    </p>
                                )}
                                <p className="text-gray-600 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    {order.shipping_address}, {order.city}
                                </p>
                                <p className="text-gray-600 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    {order.phone}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white px-8 py-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> Shipping Address
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-semibold text-gray-900">{order.user_name || `User #${order.user}`}</p>
                                <p>{order.shipping_address}</p>
                                <p>{order.city}</p>
                                {order.user_email && <p>Email: {order.user_email}</p>}
                                <p>Phone: {order.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="px-8 py-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" /> Order Items
                        </h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Product</th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Price</th>
                                    <th className="text-center py-3 px-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Qty</th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-500 uppercase text-xs tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getImageUrl(item.product_image || item.thumbnail)}
                                                    alt={item.product_name}
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100 border"
                                                />
                                                <span className="font-medium text-gray-900">{item.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right text-gray-700">{formatCurrency(item.price)}</td>
                                        <td className="py-4 px-2 text-center text-gray-700">{item.quantity}</td>
                                        <td className="py-4 px-2 text-right font-semibold text-gray-900">{formatCurrency(item.total || (parseFloat(item.price) * item.quantity))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary & Payment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200">
                        {/* Summary */}
                        <div className="bg-white px-8 py-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Summary</h3>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount {order.coupon_code ? <span className="uppercase text-xs font-bold">({order.coupon_code})</span> : ''}</span>
                                        <span>-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>{shipping > 0 ? formatCurrency(shipping) : <span className="text-green-600 font-medium">Free</span>}</span>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex justify-between font-bold text-gray-900 text-base">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                {paid > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Paid</span>
                                        <span>{formatCurrency(paid)}</span>
                                    </div>
                                )}
                                {due > 0 && (
                                    <div className="flex justify-between text-red-600 font-semibold">
                                        <span>Due</span>
                                        <span>{formatCurrency(due)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white px-8 py-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Payment Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Method</span>
                                    <span className="font-medium text-gray-900 capitalize">{order.payment_method.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Order Status</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${orderBadge.className}`}>{orderBadge.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Status</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentBadge.className}`}>{paymentBadge.label}</span>
                                </div>
                                {order.coupon && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Coupon</span>
                                        <span className="font-medium text-green-600 uppercase">{order.coupon}</span>
                                    </div>
                                )}
                                {order.tracking_number && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tracking</span>
                                        <span className="font-medium text-gray-900">{order.tracking_number}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Created</span>
                                    <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Proofs */}
                    {order.payment_proof_url && order.payment_proof_url.length > 0 && (
                        <div className="px-8 py-6 border-t border-gray-200">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment Proofs</h3>
                            <div className="flex flex-wrap gap-3">
                                {order.payment_proof_url.map((url: string, idx: number) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={url}
                                            alt={`Proof ${idx + 1}`}
                                            className="w-20 h-20 rounded-lg border object-cover hover:opacity-80 transition-opacity"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                    )}

                    {/* Terms & Footer */}
                    <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
                            <div className="space-y-1">
                                <p className="font-medium text-gray-500">Terms & Conditions</p>
                                <p>Items once sold will not be returned or exchanged without valid reason.</p>
                                <p>This is a computer-generated invoice and does not require a physical signature.</p>
                            </div>
                            <div className="space-y-1 sm:text-right">
                                <p className="font-medium text-gray-500">Contact Us</p>
                                {settings?.contact_email && (
                                    <p className="flex items-center gap-1 sm:justify-end">
                                        <Mail className="w-3 h-3" /> {settings.contact_email}
                                    </p>
                                )}
                                {settings?.contact_phone && (
                                    <p className="flex items-center gap-1 sm:justify-end">
                                        <Phone className="w-3 h-3" /> {settings.contact_phone}
                                    </p>
                                )}
                                {settings?.contact_address && (
                                    <p className="flex items-center gap-1 sm:justify-end">
                                        <MapPin className="w-3 h-3" /> {settings.contact_address}
                                    </p>
                                )}
                                {(settings?.facebook_url || settings?.instagram_url || settings?.youtube_url) && (
                                    <p className="flex items-center gap-2 sm:justify-end mt-1">
                                        <Globe className="w-3 h-3" />
                                        <span className="text-gray-400">
                                            {[settings.facebook_url, settings.instagram_url, settings.youtube_url].filter(Boolean).length} social links
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-4 bg-gray-900 text-center">
                        <p className="text-xs text-gray-400">
                            &copy; {new Date().getFullYear()} {settings?.site_name || 'Shoe Club'}. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0.3in; size: auto; }
                    html { background: white !important; }
                    body {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide everything, then selectively show only the invoice */
                    body * { visibility: hidden !important; }
                    .print-container,
                    .print-container * {
                        visibility: visible !important;
                    }
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                    }
                    .no-print { display: none !important; }
                    #invoice-content {
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        max-width: 100% !important;
                    }
                    /* Preserve background colors in print */
                    #invoice-content [class*="bg-gradient"],
                    #invoice-content [class*="bg-gray-50"],
                    #invoice-content [class*="bg-gray-900"],
                    #invoice-content [class*="bg-white/20"] {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    a[href]:after { content: none !important; }
                    img { max-width: 100% !important; page-break-inside: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}