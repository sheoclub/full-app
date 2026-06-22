import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Loader2, ArrowLeft, Upload, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '../../lib/api';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../lib/utils';
import type { Order, SiteSettings } from '../../types';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [bankSettings, setBankSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/orders/${id}/`)
            .then((res) => setOrder(res.data))
            .catch(() => setError('Order not found'))
            .finally(() => setLoading(false));
        // Fetch bank account details from site settings
        api.get('/settings/')
            .then((res) => setBankSettings(res.data))
            .catch(() => { });
    }, [id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofFile) {
            toast.error('Please upload a payment proof');
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('payment_proof', proofFile);
            await api.post(`/orders/${id}/upload_proof/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Payment proof submitted! Awaiting verification.');
            navigate(`/order/${id}`);
        } catch {
            toast.error('Failed to upload payment proof');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading payment details..." />;
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <AlertTriangle className="w-16 h-16 text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900">{error || 'Order not found'}</h2>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const paymentBadge = getStatusBadge(order.payment_status, 'payment');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to={`/order/${order.id}`} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Order
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
                    <p className="text-gray-500">Order #{order.id}</p>
                </div>

                {/* Order Info */}
                <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Payment Details
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-500">Total Amount</span>
                            <span className="font-bold text-lg text-gray-900">{formatCurrency(order.total)}</span>
                        </div>
                        {order.payment_status === 'Partial' && (
                            <div className="flex justify-between py-2 border-b text-red-600">
                                <span className="text-red-500">Due Amount</span>
                                <span className="font-bold text-lg text-red-600">{formatCurrency(order.due_amount || order.total)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method</span>
                            <span className="font-medium text-gray-900 capitalize">{order.payment_method.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className={paymentBadge.className}>{paymentBadge.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order Date</span>
                            <span className="text-gray-900">{formatDateTime(order.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Show Existing Proofs */}
                {order.payment_proof_url && order.payment_proof_url.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Uploaded Proofs</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {order.payment_proof_url.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`Proof ${idx + 1}`} className="h-28 w-full rounded-lg border object-cover hover:opacity-80 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Proof */}
                {['Online Payment', 'Bank Transfer', 'online'].includes(order.payment_method) && ['Pending', 'Partial'].includes(order.payment_status) && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Payment Proof</h2>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-800">
                            <p className="font-medium mb-2 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4" /> Bank Account Details
                            </p>
                            <p><span className="font-medium">Bank:</span> {bankSettings?.bank_name || 'HBL Pakistan'}</p>
                            <p><span className="font-medium">Account Title:</span> {bankSettings?.account_name || 'Shoe Club'}</p>
                            <p><span className="font-medium">Account Number:</span> {bankSettings?.account_number || 'PK36HBLP1234567890123'}</p>
                            {order.payment_status === 'Partial' ? (
                                <p className="mt-2 text-xs">You have a remaining balance of <strong className="text-red-600">{formatCurrency(order.due_amount || order.total)}</strong>. Please transfer the remaining amount and upload the receipt/screenshot below.</p>
                            ) : (
                                <p className="mt-2 text-xs">Please transfer the exact amount of <strong>{formatCurrency(order.total)}</strong> and upload the receipt/screenshot below.</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => document.getElementById('proof-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="proof-upload"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {proofFile ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                        <CheckCircle className="w-6 h-6" />
                                        <span className="font-medium">{proofFile.name}</span>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 font-medium">Click to upload payment proof</p>
                                        <p className="text-gray-400 text-sm mt-1">PNG, JPG, or PDF (max 5MB)</p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !proofFile}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="w-5 h-5" /> Submit Payment Proof</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Already Paid / Rejected / Other */}
                {!['Pending', 'Partial'].includes(order.payment_status) && (
                    <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-green-800 mb-1">
                            Payment {order.payment_status === 'Paid' ? 'Completed' : order.payment_status === 'Rejected' ? 'Rejected' : 'Processing'}
                        </h3>
                        <p className="text-green-600 text-sm">
                            {order.payment_status === 'Paid'
                                ? 'Your payment has been received and verified.'
                                : order.payment_status === 'Rejected'
                                    ? 'Your payment has been rejected. Please contact support.'
                                    : 'Your payment proof is being reviewed by our team.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}