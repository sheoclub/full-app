import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Coupon, Category, User, PaginatedResponse } from '@/types';
import { Loader2, AlertCircle, Plus, X, Send, Gift, Tag, ToggleLeft, ToggleRight, Trash2, Pencil, Copy, Sparkles, Users, Download, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount (PKR)' },
];

type FormMode = 'manual' | 'gift' | 'bulk' | 'everyone';

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [filterGift, setFilterGift] = useState<string>('all');
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<FormMode>('manual');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [prevPage, setPrevPage] = useState<string | null>(null);
    const pageSize = 10;

    // Regular coupon form
    const [formCode, setFormCode] = useState('');
    const [formDiscountType, setFormDiscountType] = useState('percentage');
    const [formDiscountValue, setFormDiscountValue] = useState('');
    const [formMinOrder, setFormMinOrder] = useState('');
    const [formMaxUses, setFormMaxUses] = useState('100');
    const [formDescription, setFormDescription] = useState('');
    const [formValidDays, setFormValidDays] = useState('30');
    const [formCategories, setFormCategories] = useState<number[]>([]);

    // Gift token form
    const [formTokenLength, setFormTokenLength] = useState('12');
    const [formGiftDiscountType, setFormGiftDiscountType] = useState('percentage');
    const [formGiftDiscountValue, setFormGiftDiscountValue] = useState('');
    const [formGiftValidDays, setFormGiftValidDays] = useState('30');
    const [formGiftAssignedTo, setFormGiftAssignedTo] = useState('');
    const [formGiftDescription, setFormGiftDescription] = useState('');
    const [formGiftCategories, setFormGiftCategories] = useState<number[]>([]);

    // Bulk generate form
    const [bulkQuantity, setBulkQuantity] = useState('10');
    const [bulkDiscountType, setBulkDiscountType] = useState('percentage');
    const [bulkDiscountValue, setBulkDiscountValue] = useState('');
    const [bulkValidDays, setBulkValidDays] = useState('30');
    const [bulkDescription, setBulkDescription] = useState('');
    const [bulkCategories, setBulkCategories] = useState<number[]>([]);

    // Generate for Everyone form
    const [everyoneDiscountType, setEveryoneDiscountType] = useState('percentage');
    const [everyoneDiscountValue, setEveryoneDiscountValue] = useState('');
    const [everyoneValidDays, setEveryoneValidDays] = useState('30');
    const [everyoneDescription, setEveryoneDescription] = useState('');
    const [everyoneCategories, setEveryoneCategories] = useState<number[]>([]);

    const fetchData = async (targetPage = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterGift !== 'all') params.set('is_gift', filterGift);
            params.set('page', String(targetPage));
            params.set('page_size', String(pageSize));

            const [couponsRes, categoriesRes, usersRes] = await Promise.all([
                api.get<PaginatedResponse<Coupon>>(`/admin/coupons/?${params.toString()}`),
                api.get<Category[]>('/admin/categories/'),
                api.get<User[]>('/admin/users/'),
            ]);
            setCoupons(couponsRes.data.results);
            setTotalCount(couponsRes.data.count);
            setNextPage(couponsRes.data.next);
            setPrevPage(couponsRes.data.previous);
            setPage(targetPage);
            setCategories(categoriesRes.data);
            setUsers(usersRes.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(1); }, [filterGift]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const resetForm = () => {
        setFormCode('');
        setFormDiscountType('percentage');
        setFormDiscountValue('');
        setFormMinOrder('');
        setFormMaxUses('100');
        setFormDescription('');
        setFormValidDays('30');
        setFormCategories([]);
        setFormTokenLength('12');
        setFormGiftDiscountType('percentage');
        setFormGiftDiscountValue('');
        setFormGiftValidDays('30');
        setFormGiftAssignedTo('');
        setFormGiftDescription('');
        setFormGiftCategories([]);
        setBulkQuantity('10');
        setBulkDiscountType('percentage');
        setBulkDiscountValue('');
        setBulkValidDays('30');
        setBulkDescription('');
        setBulkCategories([]);
        setEveryoneDiscountType('percentage');
        setEveryoneDiscountValue('');
        setEveryoneValidDays('30');
        setEveryoneDescription('');
        setEveryoneCategories([]);
        setEditingId(null);
        setShowForm(false);
        setFormMode('manual');
        setGeneratedToken(null);
    };

    const openEdit = (coupon: Coupon) => {
        setFormCode(coupon.code);
        setFormDiscountType(coupon.discount_type);
        setFormDiscountValue(coupon.discount_value);
        setFormMinOrder(coupon.min_order_amount || '');
        setFormMaxUses(String(coupon.max_uses));
        setFormDescription(coupon.description || '');
        setFormCategories(coupon.categories || []);
        setFormValidDays('30');
        setEditingId(coupon.id);
        setFormMode('manual');
        setShowForm(true);
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Coupon code copied!');
    };

    const handleSubmitRegular = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formCode.trim()) { toast.error('Coupon code is required'); return; }
        if (!formDiscountValue || parseFloat(formDiscountValue) <= 0) { toast.error('Valid discount value is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                code: formCode.trim().toUpperCase(),
                discount_type: formDiscountType,
                discount_value: formDiscountValue,
                min_order_amount: formMinOrder || '0',
                max_uses: parseInt(formMaxUses) || 100,
                description: formDescription,
                categories: formCategories,
                valid_from: new Date().toISOString(),
                valid_to: new Date(Date.now() + parseInt(formValidDays) * 86400000).toISOString(),
                is_active: true,
            };

            if (editingId) {
                await api.patch(`/admin/coupons/${editingId}/`, payload);
                toast.success('Coupon updated');
            } else {
                await api.post('/admin/coupons/', payload);
                toast.success('Coupon created');
            }
            resetForm();
            fetchData(1);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save coupon');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formGiftDiscountValue || parseFloat(formGiftDiscountValue) <= 0) {
            toast.error('Valid discount value is required');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                generate_token: true,
                token_length: parseInt(formTokenLength) || 12,
                discount_type: formGiftDiscountType,
                discount_value: formGiftDiscountValue,
                valid_days: parseInt(formGiftValidDays) || 30,
                assigned_to: formGiftAssignedTo ? parseInt(formGiftAssignedTo) : null,
                description: formGiftDescription || 'Gift voucher - auto generated',
                categories: formGiftCategories,
            };

            const { data } = await api.post('/admin/coupons/', payload);
            setGeneratedToken(data.code);
            toast.success('Gift token generated!');
            fetchData(1);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to generate token');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseInt(bulkQuantity);
        if (!qty || qty < 1) { toast.error('Quantity must be at least 1'); return; }
        if (qty > 500) { toast.error('Maximum 500 coupons per batch'); return; }
        if (!bulkDiscountValue || parseFloat(bulkDiscountValue) <= 0) { toast.error('Valid discount value is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                bulk_count: qty,
                discount_type: bulkDiscountType,
                discount_value: bulkDiscountValue,
                valid_days: parseInt(bulkValidDays) || 30,
                description: bulkDescription || 'Bulk promotion voucher',
                categories: bulkCategories,
            };

            const { data } = await api.post('/admin/coupons/', payload);
            toast.success(`Created ${data.count} coupons in batch ${data.batch_id}`);
            resetForm();
            fetchData(1);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to generate bulk coupons');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateForEveryone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!everyoneDiscountValue || parseFloat(everyoneDiscountValue) <= 0) {
            toast.error('Valid discount value is required');
            return;
        }

        if (!window.confirm('Generate a coupon for EVERY active user? They will receive an email notification.')) return;

        setSubmitting(true);
        try {
            const payload = {
                assign_to_all: true,
                discount_type: everyoneDiscountType,
                discount_value: everyoneDiscountValue,
                valid_days: parseInt(everyoneValidDays) || 30,
                description: everyoneDescription || 'For everyone coupon',
                categories: everyoneCategories,
            };

            const { data } = await api.post('/admin/coupons/', payload);
            toast.success(`Created ${data.count} coupons. Emails sent: ${data.email_sent || 0}`);
            resetForm();
            fetchData(1);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to generate coupons');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (filterGift !== 'all') params.set('is_gift', filterGift);

            const res = await api.get(`/admin/coupons/export/?${params.toString()}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `coupons-export-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch {
            toast.error('Failed to export CSV');
        }
    };

    const handleToggle = async (id: number) => {
        try {
            const coupon = coupons.find(c => c.id === id);
            if (!coupon) return;
            await api.patch(`/admin/coupons/${id}/`, { is_active: !coupon.is_active });
            toast.success('Toggled');
            fetchData(page);
        } catch {
            toast.error('Failed to toggle');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this coupon?')) return;
        try {
            await api.delete(`/admin/coupons/${id}/`);
            toast.success('Deleted');
            fetchData(page);
        } catch {
            toast.error('Failed to delete');
        }
    };

    const toggleCategory = (catId: number, currentList: number[], setter: (ids: number[]) => void) => {
        if (currentList.includes(catId)) {
            setter(currentList.filter(id => id !== catId));
        } else {
            setter([...currentList, catId]);
        }
    };

    const renderCategoryPills = (
        currentList: number[],
        setter: (ids: number[]) => void,
        activeColor: string = 'blue'
    ) => {
        const activeBg = activeColor === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-300'
            : activeColor === 'green' ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-blue-100 text-blue-700 border-blue-300';
        return (
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id, currentList, setter)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${currentList.includes(cat.id)
                            ? activeBg
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
                {categories.length === 0 && (
                    <span className="text-xs text-gray-400">No categories available</span>
                )}
            </div>
        );
    };

    if (loading && coupons.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
                <AlertCircle className="w-10 h-10" />
                <p>{error}</p>
                <button onClick={() => fetchData(1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Coupons & Gift Tokens</h1>
                    <p className="text-sm text-gray-500 mt-1">{totalCount} coupon(s) total</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Coupon / Token'}
                </button>
            </div>

            {showForm && (
                <div className="space-y-4">
                    {/* Mode toggle */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFormMode('manual')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formMode === 'manual'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                                }`}
                        >
                            <Tag className="w-4 h-4 inline mr-1" />
                            Manual Coupon
                        </button>
                        <button
                            onClick={() => setFormMode('gift')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formMode === 'gift'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                                }`}
                        >
                            <Gift className="w-4 h-4 inline mr-1" />
                            Gift Token
                        </button>
                        <button
                            onClick={() => setFormMode('bulk')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formMode === 'bulk'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                                }`}
                        >
                            <Sparkles className="w-4 h-4 inline mr-1" />
                            Bulk Generate
                        </button>
                        <button
                            onClick={() => setFormMode('everyone')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formMode === 'everyone'
                                ? 'bg-orange-600 text-white'
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                                }`}
                        >
                            <Send className="w-4 h-4 inline mr-1" />
                            Everyone
                        </button>
                    </div>

                    {/* Manual Coupon Form */}
                    {formMode === 'manual' && (
                        <form onSubmit={handleSubmitRegular} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                                        placeholder="e.g. SUMMER20"
                                        disabled={!!editingId}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Duration (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formValidDays}
                                        onChange={(e) => setFormValidDays(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={formDiscountType}
                                        onChange={(e) => setFormDiscountType(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        {DISCOUNT_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formDiscountValue}
                                        onChange={(e) => setFormDiscountValue(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder={formDiscountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formMinOrder}
                                        onChange={(e) => setFormMinOrder(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="0 (no minimum)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formMaxUses}
                                        onChange={(e) => setFormMaxUses(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Summer sale discount"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Restrict to Categories (optional)</label>
                                    {renderCategoryPills(formCategories, setFormCategories, 'blue')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={!!submitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingId ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Gift Token Form */}
                    {formMode === 'gift' && (
                        <form onSubmit={handleGenerateToken} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            {generatedToken && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Token Generated!</p>
                                        <p className="text-lg font-mono font-bold text-green-700 mt-1">{generatedToken}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(generatedToken)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token Length</label>
                                    <input
                                        type="number"
                                        min="4"
                                        max="32"
                                        value={formTokenLength}
                                        onChange={(e) => setFormTokenLength(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        placeholder="12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Duration (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formGiftValidDays}
                                        onChange={(e) => setFormGiftValidDays(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={formGiftDiscountType}
                                        onChange={(e) => setFormGiftDiscountType(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    >
                                        {DISCOUNT_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formGiftDiscountValue}
                                        onChange={(e) => setFormGiftDiscountValue(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        placeholder={formGiftDiscountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to User (optional)</label>
                                    <select
                                        value={formGiftAssignedTo}
                                        onChange={(e) => setFormGiftAssignedTo(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    >
                                        <option value="">— No specific user —</option>
                                        {users.filter(u => u.is_active).map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.username} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                    <input
                                        type="text"
                                        value={formGiftDescription}
                                        onChange={(e) => setFormGiftDescription(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                        placeholder="Gift voucher - auto generated"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Restrict to Categories (optional)</label>
                                    {renderCategoryPills(formGiftCategories, setFormGiftCategories, 'purple')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={!!submitting}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Sparkles className="w-4 h-4" />
                                    Generate Token
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Bulk Generate Form */}
                    {formMode === 'bulk' && (
                        <form onSubmit={handleBulkGenerate} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                                <p className="font-medium">Bulk Promotion Vouchers</p>
                                <p className="text-green-700 mt-1">Generate multiple anonymous coupon codes at once. Max 500 per batch.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={bulkQuantity}
                                        onChange={(e) => setBulkQuantity(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Max 500 coupons per batch</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Duration (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkValidDays}
                                        onChange={(e) => setBulkValidDays(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={bulkDiscountType}
                                        onChange={(e) => setBulkDiscountType(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    >
                                        {DISCOUNT_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={bulkDiscountValue}
                                        onChange={(e) => setBulkDiscountValue(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder={bulkDiscountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                    <input
                                        type="text"
                                        value={bulkDescription}
                                        onChange={(e) => setBulkDescription(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="Bulk promotion voucher"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Restrict to Categories (optional)</label>
                                    {renderCategoryPills(bulkCategories, setBulkCategories, 'green')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={!!submitting}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Sparkles className="w-4 h-4" />
                                    Generate {bulkQuantity || 'N'} Coupons
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Generate for Everyone Form */}
                    {formMode === 'everyone' && (
                        <form onSubmit={handleGenerateForEveryone} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
                                <p className="font-medium">Generate for All Active Users</p>
                                <p className="text-orange-700 mt-1">Creates one unique coupon per active user and sends it via email.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Duration (days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={everyoneValidDays}
                                        onChange={(e) => setEveryoneValidDays(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={everyoneDiscountType}
                                        onChange={(e) => setEveryoneDiscountType(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                    >
                                        {DISCOUNT_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={everyoneDiscountValue}
                                        onChange={(e) => setEveryoneDiscountValue(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder={everyoneDiscountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                    <input
                                        type="text"
                                        value={everyoneDescription}
                                        onChange={(e) => setEveryoneDescription(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="For everyone coupon"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Restrict to Categories (optional)</label>
                                    {renderCategoryPills(everyoneCategories, setEveryoneCategories, 'orange')}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={!!submitting}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Send className="w-4 h-4" />
                                    Generate for Everyone
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Filter bar + CSV Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Filter:</span>
                    <select
                        value={filterGift}
                        onChange={(e) => setFilterGift(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="all">All Coupons</option>
                        <option value="true">Gift Tokens Only</option>
                        <option value="false">Regular Coupons Only</option>
                    </select>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Coupons table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Discount</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Assigned To</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Emailed</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Used</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Active</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Valid Until</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-400">No coupons found</td>
                                </tr>
                            ) : (
                                coupons.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {c.is_gift ? (
                                                    <Gift className="w-4 h-4 text-purple-500 shrink-0" />
                                                ) : c.auto_generated ? (
                                                    <Sparkles className="w-4 h-4 text-green-500 shrink-0" />
                                                ) : (
                                                    <Tag className="w-4 h-4 text-blue-500 shrink-0" />
                                                )}
                                                <div>
                                                    <span className="text-gray-800 font-mono font-medium">{c.code}</span>
                                                    {c.description && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                                                    )}
                                                    {c.batch_id && (
                                                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                                            Batch: {c.batch_id.slice(0, 8)}...
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(c.code)}
                                                    className="p-1 text-gray-400 hover:text-blue-500"
                                                    title="Copy code"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {c.is_gift ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                    Gift
                                                </span>
                                            ) : c.auto_generated ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    Bulk
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    Manual
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {c.discount_type === 'percentage'
                                                ? `${c.discount_value}%`
                                                : formatCurrency(c.discount_value)
                                            }
                                            {c.min_order_amount && parseFloat(c.min_order_amount) > 0 && (
                                                <p className="text-xs text-gray-400">Min: {formatCurrency(c.min_order_amount)}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {c.assigned_to ? (
                                                <span className="text-xs text-gray-600">
                                                    <Users className="w-3 h-3 inline mr-1" />
                                                    User #{c.assigned_to}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Anyone</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {c.emailed_at ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                    <Mail className="w-3 h-3" />
                                                    {new Date(c.emailed_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            ) : c.assigned_to ? (
                                                <span className="text-xs text-gray-400">Pending</span>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-xs">
                                                {c.used_count} / {c.max_uses}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleToggle(c.id)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${c.is_active
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {c.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(c.valid_to)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <p className="text-sm text-gray-500">
                            Page {page} of {totalPages} ({totalCount} total)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchData(page - 1)}
                                disabled={!prevPage}
                                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchData(pageNum)}
                                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${pageNum === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchData(page + 1)}
                                disabled={!nextPage}
                                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}