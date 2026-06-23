import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    CheckCircle, XCircle, AlertCircle, Loader2, Search,
    Eye, ShieldCheck, Ban, CreditCard, ImageIcon, X, Download,
    DollarSign, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '@/types';

const statusStyles: Record<string, string> = {
    unpaid: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
};

export default function AdminPayments() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState<number | null>(null);
    const [filter, setFilter] = useState('Pending');
    const [search, setSearch] = useState('');
    const [proofModal, setProofModal] = useState<Order | null>(null);
    /** Verification dialog state — admin types how much was paid */
    const [verifyModal, setVerifyModal] = useState<{ order: Order; paidAmount: string } | null>(null);
    /** Track which proof index is selected in the gallery modal */
    const [selectedProofIndex, setSelectedProofIndex] = useState(0);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filter) params.set('payment_status', filter);
            const { data } = await api.get(`/admin/orders/?${params.toString()}`);
            setOrders(data || []);
        } catch (err: any) {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    /** Show verification dialog with amount input */
    const openVerifyDialog = (order: Order) => {
        setVerifyModal({ order, paidAmount: order.due_amount || order.total || '0' });
    };

    /** Submit verification — sends typed paid_amount to backend */
    const handleVerifySubmit = async () => {
        if (!verifyModal) return;
        const { order, paidAmount } = verifyModal;
        const paidNum = parseFloat(paidAmount);
        if (isNaN(paidNum) || paidNum < 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        setProcessing(order.id);
        try {
            await api.post(`/admin/orders/${order.id}/status/`, {
                paid_amount: paidAmount,
                payment_amount_type: order.payment_status === 'Partial' ? 'additional' : 'total',
            });
            const remainingTotal = order.payment_status === 'Partial'
                ? parseFloat(order.due_amount || '0')
                : parseFloat(order.total);
            const label = paidNum >= remainingTotal ? 'Paid in full' : paidNum > 0 ? 'Partial payment' : 'Rejected';
            toast.success(`Payment verified — ${label}`);
            setVerifyModal(null);
            fetchOrders();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to verify payment');
        } finally {
            setProcessing(null);
        }
    };

    /** Reject payment → set status to "Rejected", order to "Cancelled" */
    const handleReject = async (orderId: number) => {
        if (!window.confirm('Reject this payment? The order will be cancelled.')) return;
        setProcessing(orderId);
        try {
            await api.post(`/admin/orders/${orderId}/status/`, {
                paid_amount: '0',
                payment_amount_type: 'total',
            });
            toast.success('Payment rejected — order cancelled');
            fetchOrders();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to reject payment');
        } finally {
            setProcessing(null);
        }
    };

    const filtered = search
        ? orders.filter(o =>
            o.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
            String(o.id).includes(search) ||
            o.user_name?.toLowerCase().includes(search.toLowerCase())
        )
        : orders;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Payment Verification
                </h1>
                <p className="text-gray-500 mt-1">
                    Review uploaded payment proofs, then approve or reject
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { value: 'Pending', label: '⏳ Pending' },
                        { value: 'Paid', label: '✅ Paid' },
                        { value: 'Partial', label: '🔹 Partial' },
                        { value: 'Rejected', label: '❌ Rejected' },
                        { value: 'Unpaid', label: '⬜ Unpaid' },
                        { value: '', label: 'All' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === opt.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, tracking or name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-gray-500 mt-3">Loading orders...</p>
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-500">{error}</p>
                    <button onClick={fetchOrders} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Try Again
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-600 font-medium">No {filter} payments</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        {filter === 'pending'
                            ? 'All payments have been verified'
                            : `No orders with "${filter}" payment status`}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-500">Method</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">Paid / Due</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-500">Proof</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-500">Date</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => (
                                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        {/* Order ID */}
                                        <td className="py-3 px-4">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                #{order.id}
                                            </Link>
                                            {order.tracking_number && (
                                                <p className="text-xs text-gray-400 mt-0.5">TRK: {order.tracking_number}</p>
                                            )}
                                        </td>

                                        {/* Customer */}
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-gray-900">{order.user_name || 'N/A'}</p>
                                            <p className="text-xs text-gray-400">{order.city || ''}</p>
                                        </td>

                                        {/* Payment Method */}
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-xs font-medium text-gray-600">
                                                {order.payment_method || '—'}
                                            </span>
                                        </td>

                                        {/* Total */}
                                        <td className="py-3 px-4 text-right font-medium">
                                            {formatCurrency(order.total)}
                                        </td>

                                        {/* Paid / Due */}
                                        <td className="py-3 px-4 text-right">
                                            <p className="text-green-600 font-medium">{formatCurrency(order.paid_amount)}</p>
                                            {Number(order.due_amount) > 0 && (
                                                <p className="text-red-500 text-xs">Due: {formatCurrency(order.due_amount)}</p>
                                            )}
                                        </td>

                                        {/* Payment Status */}
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.payment_status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.payment_status}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{order.order_status}</p>
                                        </td>

                                        {/* Proof Image */}
                                        <td className="py-3 px-4 text-center">
                                            {order.payment_proof_url ? (
                                                <button
                                                    onClick={() => setProofModal(order)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="py-3 px-4 text-center text-gray-500 text-xs">
                                            {formatDate(order.created_at)}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                {/* Approve — only show when proof exists and not already paid */}
                                                {order.payment_proof && order.payment_status !== 'Paid' && (
                                                    <button
                                                        onClick={() => openVerifyDialog(order)}
                                                        disabled={processing === order.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {processing === order.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                        )}
                                                        Verify Payment
                                                    </button>
                                                )}

                                                {/* Reject — only when proof exists and not already paid/rejected */}
                                                {order.payment_proof && order.payment_status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleReject(order.id)}
                                                        disabled={processing === order.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Ban className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                )}

                                                {/* View order detail */}
                                                <Link
                                                    to={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Detail
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── Verification Amount Dialog ─── */}
            {verifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <button
                            onClick={() => setVerifyModal(null)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Verify Payment — Order #{verifyModal.order.id}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {verifyModal.order.user_name} · {verifyModal.order.payment_method} · Total: {formatCurrency(verifyModal.order.total)}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Amount Paid by Customer
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={verifyModal.paidAmount}
                                    onChange={e => setVerifyModal({ ...verifyModal, paidAmount: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Enter amount..."
                                />
                            </div>

                            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
                                <p>{'\u2022'} Amount {'>='} remaining due: <strong>Paid</strong> - order moves to <strong>Processing</strong></p>
                                <p>{'\u2022'} 0 {'<'} Amount {'<'} remaining due: <strong>Partial Payment</strong> - order stays <strong>Pending</strong></p>
                                <p>{'\u2022'} Amount = 0: <strong>Rejected</strong> - order cancelled</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setVerifyModal({ ...verifyModal, paidAmount: verifyModal.order.due_amount || verifyModal.order.total });
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Clear Due ({formatCurrency(verifyModal.order.due_amount || verifyModal.order.total)})
                                </button>
                                <button
                                    onClick={handleVerifySubmit}
                                    disabled={processing === verifyModal.order.id}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {processing === verifyModal.order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="w-4 h-4" />
                                    )}
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Proof Image Gallery Modal ─── */}
            {proofModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Payment Proof — Order #{proofModal.id}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {proofModal.user_name} · {proofModal.payment_method}
                                    {proofModal.payment_proof_url.length > 0 && (
                                        <span className="ml-2 text-gray-400">({proofModal.payment_proof_url.length} proof{proofModal.payment_proof_url.length > 1 ? 's' : ''})</span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setProofModal(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Image Gallery */}
                        <div className="p-5">
                            {proofModal.payment_proof_url.length > 0 ? (
                                <>
                                    {/* Thumbnail strip */}
                                    {proofModal.payment_proof_url.length > 1 && (
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                            {proofModal.payment_proof_url.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedProofIndex(idx)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${idx === selectedProofIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Proof ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'https://via.placeholder.com/64x64?text=Err';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Main image */}
                                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <img
                                            src={proofModal.payment_proof_url[selectedProofIndex]}
                                            alt={`Payment proof ${selectedProofIndex + 1} for order #${proofModal.id}`}
                                            className="w-full h-auto object-contain max-h-[55vh]"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/600x400?text=Image+Not+Found';
                                            }}
                                        />
                                    </div>

                                    {/* Navigation dots */}
                                    {proofModal.payment_proof_url.length > 1 && (
                                        <div className="flex items-center justify-center gap-1.5 mt-3">
                                            {proofModal.payment_proof_url.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedProofIndex(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === selectedProofIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p>No proof images available</p>
                                </div>
                            )}

                            {/* Actions row */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex gap-2">
                                    {['Pending', 'Partial'].includes(proofModal.payment_status) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setProofModal(null);
                                                    openVerifyDialog(proofModal);
                                                }}
                                                disabled={processing === proofModal.id}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {processing === proofModal.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="w-4 h-4" />
                                                )}
                                                Verify Payment
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleReject(proofModal.id);
                                                    setProofModal(null);
                                                }}
                                                disabled={processing === proofModal.id}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                                {proofModal.payment_proof_url.length > 0 && (
                                    <a
                                        href={proofModal.payment_proof_url[selectedProofIndex]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Open Original
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}