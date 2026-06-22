import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { Banner, Product } from '@/types';
import { getImageUrl } from '@/lib/utils';
import { Loader2, AlertCircle, Plus, X, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const BANNER_TYPES = ['hero', 'promo', 'sidebar'] as const;

interface BulkBannerEntry {
    key: string;
    title: string;
    subtitle: string;
    link_url: string;
    banner_type: string;
    sort_order: number;
    product: number | '';
    image: File | null;
}

export default function AdminBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        subtitle: '',
        link_url: '',
        banner_type: 'hero',
        sort_order: 0,
        product: '' as number | '',
        image: null as File | null,
    });

    // Bulk upload state
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [bulkEntries, setBulkEntries] = useState<BulkBannerEntry[]>([]);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const fetchBanners = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<Banner[]>('/admin/banners/');
            setBanners(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get<Product[]>('/admin/products/', { params: { limit: 1000 } });
            setProducts(Array.isArray(data) ? data : []);
        } catch {
            // non-critical
        }
    };

    useEffect(() => {
        fetchBanners();
        fetchProducts();
    }, []);

    const resetForm = () => {
        setForm({ title: '', subtitle: '', link_url: '', banner_type: 'hero', sort_order: 0, product: '', image: null });
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('title', form.title);
            payload.append('subtitle', form.subtitle);
            payload.append('link_url', form.link_url);
            payload.append('banner_type', form.banner_type);
            payload.append('sort_order', String(form.sort_order));
            if (form.product !== '') payload.append('product', String(form.product));
            if (form.image) payload.append('image', form.image);

            await api.post('/admin/banners/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Banner created');
            resetForm();
            fetchBanners();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create banner');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await api.post(`/admin/banners/${id}/`);
            toast.success('Banner toggled');
            fetchBanners();
        } catch {
            toast.error('Failed to toggle banner');
        }
    };

    const handleReorder = async (id: number, direction: 'up' | 'down') => {
        try {
            await api.post(`/admin/banners/${id}/reorder/${direction}/`);
            fetchBanners();
        } catch {
            toast.error('Failed to reorder');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this banner?')) return;
        try {
            await api.delete(`/admin/banners/${id}/`);
            toast.success('Banner deleted');
            fetchBanners();
        } catch {
            toast.error('Failed to delete');
        }
    };

    // Bulk handlers
    const initBulkUpload = () => {
        setShowBulkForm(true);
        setShowForm(false);
        setBulkEntries([
            { key: crypto.randomUUID(), title: '', subtitle: '', link_url: '', banner_type: 'hero', sort_order: 0, product: '', image: null },
        ]);
    };

    const addBulkEntry = () => {
        setBulkEntries(prev => [...prev, {
            key: crypto.randomUUID(), title: '', subtitle: '', link_url: '', banner_type: 'hero', sort_order: prev.length, product: '', image: null,
        }]);
    };

    const removeBulkEntry = (key: string) => {
        setBulkEntries(prev => prev.filter(e => e.key !== key));
    };

    const updateBulkEntry = (key: string, field: keyof BulkBannerEntry, value: any) => {
        setBulkEntries(prev => prev.map(e => e.key === key ? { ...e, [field]: value } : e));
    };

    const cancelBulk = () => {
        setShowBulkForm(false);
        setBulkEntries([]);
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const valid = bulkEntries.filter(e => e.image !== null);
        if (valid.length === 0) {
            toast.error('Add at least one banner with an image');
            return;
        }
        setBulkSubmitting(true);
        try {
            const payload = new FormData();
            const bannersPayload: any[] = [];
            valid.forEach((entry, idx) => {
                const imageKey = `file_${idx}`;
                bannersPayload.push({
                    title: entry.title,
                    subtitle: entry.subtitle,
                    link_url: entry.link_url,
                    banner_type: entry.banner_type,
                    sort_order: entry.sort_order,
                    product: entry.product || null,
                    image_key: imageKey,
                });
                if (entry.image) payload.append(imageKey, entry.image);
            });
            payload.append('banners', JSON.stringify(bannersPayload));

            await api.post('/admin/banners/bulk/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`${valid.length} banner(s) created`);
            cancelBulk();
            fetchBanners();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create banners');
        } finally {
            setBulkSubmitting(false);
        }
    };

    if (loading) {
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
                <button onClick={fetchBanners} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
                    <p className="text-sm text-gray-500 mt-1">{banners.length} banner(s)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={initBulkUpload}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => { setShowForm(!showForm); setShowBulkForm(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'Cancel' : 'Add Banner'}
                    </button>
                </div>
            </div>

            {/* Single Banner Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text" value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Banner title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input
                                type="text" value={form.subtitle}
                                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Subtitle text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                            <input
                                type="text" value={form.link_url}
                                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="/shop"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Type</label>
                            <select
                                value={form.banner_type}
                                onChange={(e) => setForm({ ...form, banner_type: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {BANNER_TYPES.map((t) => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input
                                type="number" value={form.sort_order}
                                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Associated Product</label>
                            <select
                                value={form.product}
                                onChange={(e) => setForm({ ...form, product: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">-- None (standalone) --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Link this banner to a product page</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <input
                                type="file" accept="image/*"
                                onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Banner
                        </button>
                    </div>
                </form>
            )}

            {/* Bulk Upload Form */}
            {showBulkForm && (
                <form onSubmit={handleBulkSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Bulk Upload Banners</h2>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={addBulkEntry} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Add Row
                            </button>
                            <button type="button" onClick={cancelBulk} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {bulkEntries.map((entry, idx) => (
                            <div key={entry.key} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-500">Banner #{idx + 1}</span>
                                    {bulkEntries.length > 1 && (
                                        <button type="button" onClick={() => removeBulkEntry(entry.key)} className="p-1 text-red-400 hover:text-red-600 transition-colors" title="Remove">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Title</label>
                                        <input
                                            type="text" value={entry.title}
                                            onChange={(e) => updateBulkEntry(entry.key, 'title', e.target.value)}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Subtitle</label>
                                        <input
                                            type="text" value={entry.subtitle}
                                            onChange={(e) => updateBulkEntry(entry.key, 'subtitle', e.target.value)}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="Subtitle"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Type</label>
                                        <select
                                            value={entry.banner_type}
                                            onChange={(e) => updateBulkEntry(entry.key, 'banner_type', e.target.value)}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        >
                                            {BANNER_TYPES.map(t => (
                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Sort Order</label>
                                        <input
                                            type="number" value={entry.sort_order}
                                            onChange={(e) => updateBulkEntry(entry.key, 'sort_order', parseInt(e.target.value) || 0)}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Product (optional)</label>
                                        <select
                                            value={entry.product}
                                            onChange={(e) => updateBulkEntry(entry.key, 'product', e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        >
                                            <option value="">-- None --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Link URL</label>
                                        <input
                                            type="text" value={entry.link_url}
                                            onChange={(e) => updateBulkEntry(entry.key, 'link_url', e.target.value)}
                                            className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="/shop"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 mb-0.5">Image *</label>
                                        <input
                                            type="file" accept="image/*"
                                            onChange={(e) => updateBulkEntry(entry.key, 'image', e.target.files?.[0] || null)}
                                            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:rounded file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400 self-center">
                            {bulkEntries.filter(e => e.image !== null).length} banner(s) ready
                        </span>
                        <button
                            type="submit" disabled={bulkSubmitting || bulkEntries.filter(e => e.image !== null).length === 0}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {bulkSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Upload {bulkEntries.filter(e => e.image !== null).length} Banner(s)
                        </button>
                    </div>
                </form>
            )}

            {/* Banners Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Image</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Active</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-400">No banners found</td>
                                </tr>
                            ) : (
                                banners.map((banner, idx) => {
                                    const linkedProduct = products.find(p => p.id === banner.product);
                                    return (
                                        <tr key={banner.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-500 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-medium">{banner.sort_order ?? idx}</span>
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() => handleReorder(banner.id, 'up')}
                                                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                            disabled={idx === 0}
                                                            title="Move up"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReorder(banner.id, 'down')}
                                                            className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                            disabled={idx === banners.length - 1}
                                                            title="Move down"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <img
                                                    src={getImageUrl(banner.image)}
                                                    alt={banner.title}
                                                    className="w-16 h-10 object-cover rounded"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-gray-800">{banner.title || '(no title)'}</div>
                                                {banner.subtitle && (
                                                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{banner.subtitle}</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                    {banner.banner_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {linkedProduct ? (
                                                    <span className="text-xs text-blue-600 truncate max-w-[150px] block">
                                                        {linkedProduct.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(banner.id)}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${banner.active
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {banner.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {banner.active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}