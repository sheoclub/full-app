import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import type { Product, User } from '@/types';

interface OrderItemEntry {
    tempId: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
}

export default function AdminCreateOrder() {
    const navigate = useNavigate();

    // ── Customer Details ──────────────────────────────────────────
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');

    // ── Order Meta ────────────────────────────────────────────────
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [paymentStatus, setPaymentStatus] = useState('Unpaid');
    const [orderStatus, setOrderStatus] = useState('Pending');
    const [paidAmount, setPaidAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [shippingCost, setShippingCost] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');

    // ── Items ─────────────────────────────────────────────────────
    const [items, setItems] = useState<OrderItemEntry[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allProductsLoading, setAllProductsLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // ── User lookup ───────────────────────────────────────────────
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [userSearching, setUserSearching] = useState(false);

    // ── Submission ────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // ── Fetch all products for dropdown ──────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            setAllProductsLoading(true);
            try {
                const res = await api.get('/admin/products/');
                setAllProducts(res.data.results || res.data || []);
            } catch {
                setAllProducts([]);
            } finally {
                setAllProductsLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Search users ──────────────────────────────────────────────
    useEffect(() => {
        if (userSearch.trim().length < 2) {
            setUserResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setUserSearching(true);
            try {
                const res = await api.get(`/admin/users/?search=${encodeURIComponent(userSearch)}`);
                setUserResults(res.data.results || res.data || []);
            } catch {
                setUserResults([]);
            } finally {
                setUserSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [userSearch]);

    // ── Add product to items ──────────────────────────────────────
    // ── Add selected product from dropdown ────────────────────────
    const addSelectedProduct = () => {
        if (!selectedProductId) return;
        const product = allProducts.find(p => p.id.toString() === selectedProductId);
        if (!product) return;
        addProduct(product);
        setSelectedProductId('');
    };

    const addProduct = (product: Product) => {
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
            setItems(prev =>
                prev.map(i =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
                        : i
                )
            );
        } else {
            const price = parseFloat(product.price.toString());
            setItems(prev => [
                ...prev,
                {
                    tempId: Date.now() + Math.random(),
                    product_id: product.id,
                    product_name: product.name,
                    price,
                    quantity: 1,
                    total: price,
                },
            ]);
        }
    };

    // ── Update item quantity ──────────────────────────────────────
    const updateQuantity = (tempId: number, qty: number) => {
        if (qty < 1) qty = 1;
        setItems(prev =>
            prev.map(i =>
                i.tempId === tempId ? { ...i, quantity: qty, total: qty * i.price } : i
            )
        );
    };

    // ── Update item price ─────────────────────────────────────────
    const updatePrice = (tempId: number, price: number) => {
        if (price < 0) price = 0;
        setItems(prev =>
            prev.map(i =>
                i.tempId === tempId ? { ...i, price, total: i.quantity * price } : i
            )
        );
    };

    // ── Remove item ───────────────────────────────────────────────
    const removeItem = (tempId: number) => {
        setItems(prev => prev.filter(i => i.tempId !== tempId));
    };

    // ── Calculate totals ──────────────────────────────────────────
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const shipCost = parseFloat(shippingCost) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const grandTotal = Math.max(subtotal + shipCost - discount, 0);

    // ── Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (items.length === 0) {
            setError('Add at least one product to the order.');
            return;
        }
        if (!customerName.trim() && !selectedUserId) {
            setError('Enter a customer name or select an existing user.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                user_id: selectedUserId,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                shipping_address: shippingAddress,
                city,
                province,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                order_status: orderStatus,
                paid_amount: paidAmount || 0,
                notes,
                shipping_cost: shippingCost || 0,
                discount_amount: discountAmount || 0,
                items: items.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    price: i.price,
                })),
            };

            const res = await api.post('/admin/orders/create/', payload);
            navigate(`/admin/orders/${res.data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Create Custom Order</h1>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ── Customer Section ────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Existing User</label>
                            <input
                                type="text"
                                placeholder="Search user by name/email..."
                                value={userSearch}
                                onChange={e => {
                                    setUserSearch(e.target.value);
                                    setSelectedUserId(null);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {userSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                            {userResults.length > 0 && (
                                <ul className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                                    {userResults.map(u => (
                                        <li
                                            key={u.id}
                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedUserId === u.id ? 'bg-blue-100 font-medium' : ''}`}
                                            onClick={() => {
                                                setSelectedUserId(u.id);
                                                setCustomerName(`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username);
                                                setCustomerEmail(u.email);
                                                setCustomerPhone(u.phone || '');
                                                setUserSearch(`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username);
                                                setUserResults([]);
                                            }}
                                        >
                                            {u.first_name} {u.last_name} ({u.email})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex items-end">
                            {selectedUserId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedUserId(null);
                                        setUserSearch('');
                                    }}
                                    className="text-sm text-red-500 hover:text-red-700"
                                >
                                    Clear user selection
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required={!selectedUserId}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={e => setCustomerEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                            <textarea
                                rows={2}
                                value={shippingAddress}
                                onChange={e => setShippingAddress(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Products Section ────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Products</h2>

                    {/* Product Dropdown */}
                    <div className="flex items-end gap-3 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                            <select
                                value={selectedProductId}
                                onChange={e => setSelectedProductId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">-- Choose a product --</option>
                                {allProductsLoading ? (
                                    <option disabled>Loading products...</option>
                                ) : (
                                    allProducts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} — RS {parseFloat(p.price.toString()).toLocaleString()} {p.stock !== undefined ? `(Stock: ${p.stock})` : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={addSelectedProduct}
                            disabled={!selectedProductId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>

                    {/* Items Table */}
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No products added yet. Search and add products above.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-2 px-3 font-medium text-gray-600">Product</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-600">Price (RS)</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-600">Qty</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-600">Total (RS)</th>
                                        <th className="text-center py-2 px-3 font-medium text-gray-600 w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.tempId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-2 px-3 font-medium">{item.product_name}</td>
                                            <td className="py-2 px-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={e => updatePrice(item.tempId, parseFloat(e.target.value) || 0)}
                                                    className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.tempId, item.quantity - 1)}
                                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3.5 h-3.5 text-gray-600" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.tempId, item.quantity + 1)}
                                                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-medium">
                                                RS {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.tempId)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Order Summary & Meta ────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Meta */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option>Cash on Delivery</option>
                                    <option>Online Payment</option>
                                    <option>Bank Transfer</option>
                                    <option>JazzCash</option>
                                    <option>EasyPaisa</option>
                                    <option>Card Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <select
                                    value={paymentStatus}
                                    onChange={e => setPaymentStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option>Unpaid</option>
                                    <option>Paid</option>
                                    <option>Partial</option>
                                    <option>Pending</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                                <select
                                    value={orderStatus}
                                    onChange={e => setOrderStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                >
                                    <option>Pending</option>
                                    <option>Processing</option>
                                    <option>Shipped</option>
                                    <option>In Transit</option>
                                    <option>Delivered</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (RS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Totals</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">RS {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost (RS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shippingCost}
                                    onChange={e => setShippingCost(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (RS)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={discountAmount}
                                    onChange={e => setDiscountAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Grand Total</span>
                                    <span className="text-blue-600">RS {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>Due</span>
                                    <span>RS {Math.max(grandTotal - (parseFloat(paidAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating Order...
                                </>
                            ) : (
                                'Create Order'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}