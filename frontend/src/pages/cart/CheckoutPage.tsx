import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, MapPin, CreditCard, Truck, Tag, Upload, CheckCircle, Building, Landmark, Globe, Banknote, Package } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import type { DeliveryCharge, ProvinceOption } from '../../types';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { cart, fetchCart, isLoading } = useCartStore();
    const { user } = useAuthStore();
    const [submitting, setSubmitting] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [coupon, setCoupon] = useState<{ code: string; discount: number; discount_type: string; discount_value: number } | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [deliveryCharges, setDeliveryCharges] = useState<DeliveryCharge[]>([]);
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedChargeId, setSelectedChargeId] = useState<number | null>(null);
    const [deliveryMode, setDeliveryMode] = useState<string>('quantity');
    const [form, setForm] = useState({
        address: '',
        city: '',
        phone: '',
        payment_method: 'cod',
    });

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                phone: user.phone || prev.phone,
            }));
        }
    }, [user]);

    const [bankSettings, setBankSettings] = useState<Record<string, string>>({});

    // Fetch site settings (bank details + delivery_mode)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings/');
                setBankSettings(res.data);
                if (res.data.delivery_mode) {
                    setDeliveryMode(res.data.delivery_mode);
                }
            } catch (_e) {
                // Silently fail
            }
        };
        fetchSettings();
    }, []);

    // Fetch provinces and delivery charges (only needed in city mode)
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await api.get<ProvinceOption[]>('/delivery-charges/provinces/');
                setProvinces(res.data);
            } catch (_e) {
                // Silently fail
            }
        };
        const fetchCharges = async () => {
            try {
                const res = await api.get('/delivery-charges/');
                setDeliveryCharges(res.data);
            } catch (_e) {
                // Silently fail
            }
        };
        fetchProvinces();
        fetchCharges();
    }, []);

    // When province + city selected, auto-set the delivery charge ID
    useEffect(() => {
        if (!form.city || !selectedProvince || deliveryCharges.length === 0) return;
        const match = deliveryCharges.find(
            (dc) => dc.city.toLowerCase() === form.city.toLowerCase() && dc.province === selectedProvince
        );
        setSelectedChargeId(match ? match.id : null);
    }, [form.city, selectedProvince, deliveryCharges]);

    const subtotal = cart.items.reduce(
        (sum, item) => sum + Number(item.total_price || item.product.price),
        0
    );

    const discountAmount = coupon
        ? coupon.discount_type === 'percentage'
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Math.min(Number(coupon.discount_value), subtotal)
        : 0;

    const total = Math.max(0, subtotal - discountAmount);

    // Calculate shipping based on delivery mode
    const selectedCharge = deliveryCharges.find(c => c.id === selectedChargeId);
    let shipping = 0;
    if (deliveryMode === 'quantity') {
        // Per-product block pricing
        const perProductCharges = cart.items
            .filter(item => item.product.min_quantity > 1 && Number(item.product.delivery_charge) > 0)
            .map(item => {
                const qty = item.quantity;
                const minQty = item.product.min_quantity;
                const chargePerBlock = Number(item.product.delivery_charge);
                const blocks = Math.ceil(qty / minQty);
                return blocks * chargePerBlock;
            });
        if (perProductCharges.length > 0) {
            shipping = perProductCharges.reduce((sum, c) => sum + c, 0);
        }
    } else {
        // City-based delivery charge
        const chargeAmount = selectedCharge ? parseFloat(selectedCharge.charge) : 0;
        shipping = chargeAmount;
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await api.post('/checkout/validate-coupon/', { code: couponCode, total: subtotal });
            setCoupon(res.data);
            toast.success('Coupon applied!');
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Invalid coupon code';
            setCouponError(msg);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.address || !form.city || !form.phone) {
            toast.error('Please fill in all required fields');
            return;
        }
        if ((form.payment_method === 'bank_transfer' || form.payment_method === 'online') && !proofFile) {
            toast.error('Please upload your payment proof screenshot');
            return;
        }
        setSubmitting(true);
        try {
            const isBankTransfer = form.payment_method === 'bank_transfer';
            const hasFile = isBankTransfer || (form.payment_method === 'online' && proofFile != null);

            let payload: any;
            let headers: any = {};

            // In city mode, include province in the address for complete details on admin/invoice
            const fullAddress = deliveryMode === 'city' && selectedProvince
                ? `${form.address}, ${selectedProvince}`
                : form.address;

            if (hasFile) {
                // Use FormData for file upload
                const formData = new FormData();
                formData.append('shipping_address', fullAddress);
                formData.append('city', form.city);
                formData.append('phone', form.phone);
                formData.append('payment_method', form.payment_method);
                if (coupon) formData.append('coupon_code', coupon.code);
                if (deliveryMode === 'city' && selectedChargeId) formData.append('delivery_charge_id', String(selectedChargeId));
                formData.append('payment_proof', proofFile!);
                payload = formData;
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                payload = {
                    shipping_address: fullAddress,
                    city: form.city,
                    phone: form.phone,
                    payment_method: form.payment_method,
                };
                if (coupon) payload.coupon_code = coupon.code;
                if (deliveryMode === 'city' && selectedChargeId) payload.delivery_charge_id = selectedChargeId;
            }

            const res = await api.post('/checkout/', payload, { headers });
            toast.success(isBankTransfer ? 'Order placed! Awaiting payment verification.' : 'Order placed successfully!');
            await fetchCart();
            navigate(`/order/${res.data.id}`);
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to place order';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner fullPage text="Loading checkout..." />;
    }

    if (cart.items.length === 0) {
        navigate('/cart');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left - Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Details */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Shipping Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                            placeholder="Street address, house number, area"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {deliveryMode === 'city' ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                                        <Globe className="w-4 h-4 text-blue-500" />
                                                        Province <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={selectedProvince}
                                                        onChange={(e) => {
                                                            setSelectedProvince(e.target.value);
                                                            setForm({ ...form, city: '' });
                                                            setSelectedChargeId(null);
                                                        }}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                        required
                                                    >
                                                        <option value="">Select province</option>
                                                        {provinces.map((p) => (
                                                            <option key={p.value} value={p.value}>{p.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        City <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={form.city}
                                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                        required
                                                        disabled={!selectedProvince}
                                                    >
                                                        <option value="">Select city</option>
                                                        {deliveryCharges
                                                            .filter((dc) => dc.province === selectedProvince)
                                                            .map((dc) => (
                                                                <option key={dc.id} value={dc.city}>
                                                                    {dc.city}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.city}
                                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    placeholder="e.g. Karachi, Lahore"
                                                    required
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                placeholder="03XX-XXXXXXX"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    Payment Method
                                </h2>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-all">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cod"
                                            checked={form.payment_method === 'cod'}
                                            onChange={() => setForm({ ...form, payment_method: 'cod' })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Cash on Delivery</span>
                                            <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-all">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="bank_transfer"
                                            checked={form.payment_method === 'bank_transfer'}
                                            onChange={() => setForm({ ...form, payment_method: 'bank_transfer' })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Bank Transfer</span>
                                            <p className="text-sm text-gray-500">Transfer directly to our bank account</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition-all">
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="online"
                                            checked={form.payment_method === 'online'}
                                            onChange={() => setForm({ ...form, payment_method: 'online' })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">Online Payment</span>
                                            <p className="text-sm text-gray-500">Pay via credit/debit card or online banking</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Bank Transfer Details — shown when bank_transfer or online payment is selected */}
                                {(form.payment_method === 'bank_transfer' || form.payment_method === 'online') && (
                                    <div className="mt-4 space-y-4">
                                        {/* Bank Account Info */}
                                        <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-800 border border-yellow-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Banknote className="w-5 h-5" />
                                                <span className="font-semibold">Bank Account Details</span>
                                            </div>
                                            <div className="space-y-1 ml-7">
                                                <p><span className="font-medium">Bank:</span> {bankSettings.bank_name || 'Femme Bank'}</p>
                                                <p><span className="font-medium">Account Name:</span> {bankSettings.account_name || 'Ladies Shoe Club'}</p>
                                                <p><span className="font-medium">Account Number:</span> {bankSettings.account_number || '1234567890'}</p>
                                                <p className="mt-2 text-xs">Please transfer the exact amount and upload the receipt/screenshot below.</p>
                                            </div>
                                        </div>

                                        {/* Upload Payment Proof */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Upload Payment Screenshot <span className="text-red-500">*</span>
                                            </label>
                                            <div
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                                onClick={() => document.getElementById('checkout-proof')?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="checkout-proof"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                toast.error('File size must be less than 5MB');
                                                                return;
                                                            }
                                                            setProofFile(file);
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                {proofFile ? (
                                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                                        <CheckCircle className="w-6 h-6" />
                                                        <span className="font-medium">{proofFile.name}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                                        <p className="text-gray-600 font-medium">Click to upload payment proof</p>
                                                        <p className="text-gray-400 text-xs mt-1">PNG, JPG, or PDF (max 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                                    Order Summary
                                </h2>

                                {/* Items */}
                                <div className="space-y-3 mb-4">
                                    {cart.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <img
                                                src={getImageUrl(item.product.image)}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</p>
                                                {item.variant && (
                                                    <p className="text-xs text-gray-500">
                                                        {item.variant.size && `Size: ${item.variant.size}`}
                                                        {item.variant.color && ` | ${item.variant.color}`}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                    {formatCurrency(Number(item.total_price || item.product.price))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon */}
                                <div className="mb-4">
                                    {coupon ? (
                                        <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-700">{coupon.code}</span>
                                            </div>
                                            <button type="button" onClick={() => { setCoupon(null); setCouponCode(''); }} className="text-xs text-red-500">
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Coupon code"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponCode.trim()}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                    )}
                                    {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                                </div>

                                {/* Delivery Charge Info */}
                                {deliveryMode === 'city' && selectedCharge && (
                                    <div className="mb-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-800">
                                                    Delivery to {selectedCharge.city}, {selectedCharge.province}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-800">
                                                {formatCurrency(selectedCharge.charge)}
                                            </span>
                                        </div>
                                        {selectedCharge.min_order_for_free && parseFloat(selectedCharge.min_order_for_free) > 0 && (
                                            <p className="text-xs text-blue-600 mt-1 ml-7">
                                                Free delivery on orders over {formatCurrency(selectedCharge.min_order_for_free)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {deliveryMode === 'quantity' && shipping > 0 && (
                                    <div className="mb-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">
                                                Delivery: {formatCurrency(shipping)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Totals */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal ({cart.item_count} items)</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Truck className="w-4 h-4" />
                                            Shipping
                                        </span>
                                        <span>{formatCurrency(shipping)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{formatCurrency(total + shipping)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</>
                                    ) : (
                                        <><ShoppingBag className="w-5 h-5" /> Place Order</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}