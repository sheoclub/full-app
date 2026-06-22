import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, getImageUrl, formatDateTime } from '@/lib/utils';
import { Package, Plus, Search, Edit3, Trash2, X, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon, GripVertical } from 'lucide-react';
import type { Product, Category, Brand, ProductImage, ProductVariant } from '@/types';
import toast from 'react-hot-toast';

interface ProductForm {
    name: string;
    category: number | '';
    price: string;
    compare_price: string;
    retail_price: string;
    description: string;
    stock: number | '';
    status: string;
    is_featured: boolean;
    has_variants: boolean;
    free_delivery: boolean;
    min_quantity: number;
    delivery_charge: string;
    brand: number | '';
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    tags: string;
    image: File | null;
    specifications: string;
}

interface VariantForm {
    size: string;
    color: string;
    color_code: string;
    sku: string;
    price_override: string;
    stock: number;
    image: File | null;
    is_active: boolean;
}

interface GalleryImageEntry {
    id?: number;
    image: string | File;
    alt_text: string;
    sort_order: number;
    isExisting: boolean;
    file?: File;
}

interface VariantEntry {
    tempId: string;
    color: string;
    color_code: string;
    size: string;
    price_override: string;
    stock: number;
    sku: string;
    is_active: boolean;
    image: File | null;
}

const COMMON_COLORS = [
    { name: 'Red', code: '#FF0000' },
    { name: 'Black', code: '#000000' },
    { name: 'Blue', code: '#0000FF' },
    { name: 'White', code: '#FFFFFF' },
    { name: 'Green', code: '#008000' },
    { name: 'Yellow', code: '#FFFF00' },
    { name: 'Pink', code: '#FFC0CB' },
    { name: 'Purple', code: '#800080' },
    { name: 'Orange', code: '#FFA500' },
    { name: 'Brown', code: '#8B4513' },
    { name: 'Gray', code: '#808080' },
    { name: 'Navy', code: '#000080' },
    { name: 'Teal', code: '#008080' },
    { name: 'Maroon', code: '#800000' },
    { name: 'Olive', code: '#808000' },
];

const emptyForm: ProductForm = {
    name: '', category: '', price: '', compare_price: '', retail_price: '', description: '',
    stock: '', status: 'active', is_featured: false, has_variants: false, free_delivery: false,
    min_quantity: 1, delivery_charge: '',
    brand: '', meta_title: '', meta_description: '', meta_keywords: '',
    tags: '', image: null, specifications: '{}',
};

const emptyVariant: VariantForm = {
    size: '', color: '', color_code: '#000000', sku: '', price_override: '', stock: 0, image: null, is_active: true,
};

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Gallery state
    const [galleryImages, setGalleryImages] = useState<GalleryImageEntry[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);

    // Variant state
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
    const [variantForm, setVariantForm] = useState<VariantForm>(emptyVariant);
    const [variantSubmitting, setVariantSubmitting] = useState(false);

    // Multi-variant entry state
    const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([]);
    const [bulkVariantColor, setBulkVariantColor] = useState('#000000');
    const [bulkVariantColorName, setBulkVariantColorName] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [prodRes, catRes, brandRes] = await Promise.all([
                api.get('/admin/products/', { params: { search, status: statusFilter } }),
                api.get('/admin/categories/'),
                api.get('/admin/brands/'),
            ]);
            setBrands(brandRes.data);
            // Apply client-side stock filter
            let filtered = prodRes.data;
            if (stockFilter === 'low') {
                filtered = filtered.filter((p: Product) => p.stock > 0 && p.stock <= 5);
            } else if (stockFilter === 'out') {
                filtered = filtered.filter((p: Product) => p.stock === 0);
            } else if (stockFilter === 'in') {
                filtered = filtered.filter((p: Product) => p.stock > 5);
            }
            setProducts(filtered);
            setCategories(catRes.data);
        } catch {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, stockFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name === 'stock' || name === 'category') {
            setForm(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setForm(prev => ({ ...prev, image: e.target.files![0] }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setGalleryImages([]);
        setVariants([]);
        setShowVariantForm(false);
        setEditingVariantId(null);
        setVariantForm(emptyVariant);
    };

    const fetchProductDetail = async (productId: number) => {
        try {
            const { data } = await api.get<Product>(`/admin/products/${productId}/`);
            return data;
        } catch {
            return null;
        }
    };

    const fetchGallery = async (productId: number) => {
        setGalleryLoading(true);
        try {
            const { data } = await api.get<ProductImage[]>(`/admin/products/${productId}/gallery/`);
            setGalleryImages(data.map(img => ({
                id: img.id,
                image: img.image,
                alt_text: img.alt_text,
                sort_order: img.sort_order,
                isExisting: true,
            })));
        } catch {
            // non-critical
        } finally {
            setGalleryLoading(false);
        }
    };

    const fetchVariants = async (productId: number) => {
        setVariantsLoading(true);
        try {
            const { data } = await api.get<ProductVariant[]>(`/admin/products/${productId}/variants/`);
            setVariants(data);
        } catch {
            // non-critical
        } finally {
            setVariantsLoading(false);
        }
    };

    const openEdit = async (product: Product) => {
        setForm({
            name: product.name,
            category: product.category || '',
            brand: product.brand ?? '',
            price: product.price.toString(),
            compare_price: product.compare_price?.toString() || '',
            retail_price: product.retail_price?.toString() || '',
            description: product.description,
            stock: product.stock,
            status: product.status ? 'active' : 'inactive',
            is_featured: product.is_featured,
            has_variants: product.has_variants,
            free_delivery: product.free_delivery ?? false,
            min_quantity: product.min_quantity ?? 1,
            delivery_charge: product.delivery_charge?.toString() || '',
            meta_title: product.meta_title || '',
            meta_description: product.meta_description || '',
            meta_keywords: product.meta_keywords || '',
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
            image: null,
            specifications: typeof product.specifications === 'object' ? JSON.stringify(product.specifications) : '{}',
        });
        setEditingId(product.id);
        setShowForm(true);
        // Fetch gallery and variants for this product
        fetchGallery(product.id);
        fetchVariants(product.id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Product name is required'); return; }
        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('name', form.name);
            if (form.category) payload.append('category', String(form.category));
            if (form.brand) payload.append('brand', String(form.brand));
            payload.append('meta_title', form.meta_title);
            payload.append('meta_description', form.meta_description);
            payload.append('meta_keywords', form.meta_keywords);
            payload.append('price', String(form.price || 0));
            if (form.compare_price) payload.append('compare_price', form.compare_price);
            if (form.retail_price) payload.append('retail_price', form.retail_price);
            payload.append('description', form.description);
            payload.append('stock', String(form.stock || 0));
            payload.append('status', form.status);
            payload.append('is_featured', String(form.is_featured));
            payload.append('has_variants', String(form.has_variants));
            payload.append('free_delivery', String(form.free_delivery));
            payload.append('min_quantity', String(form.min_quantity));
            if (form.delivery_charge) payload.append('delivery_charge', form.delivery_charge);
            payload.append('tags', form.tags);
            payload.append('specifications', form.specifications);
            if (form.image) payload.append('image', form.image);

            if (editingId) {
                await api.patch(`/admin/products/${editingId}/`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Product updated');
            } else {
                const { data } = await api.post('/admin/products/', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Product created');
                // Open edit mode for the new product so user can add gallery/variants
                if (data?.id) {
                    openEdit(data);
                    return;
                }
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/products/${id}/`);
            toast.success('Product deleted');
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to delete product');
        }
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Gallery handlers
    const handleGalleryFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newEntries: GalleryImageEntry[] = [];
        for (let i = 0; i < files.length; i++) {
            newEntries.push({
                image: files[i],
                alt_text: '',
                sort_order: galleryImages.length + newEntries.length,
                isExisting: false,
                file: files[i],
            });
        }
        setGalleryImages(prev => [...prev, ...newEntries]);
        e.target.value = '';
    };

    const updateGalleryEntry = (index: number, field: keyof GalleryImageEntry, value: any) => {
        setGalleryImages(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
    };

    const removeGalleryEntry = async (index: number) => {
        const entry = galleryImages[index];
        if (entry.isExisting && entry.id) {
            if (!window.confirm('Remove this gallery image?')) return;
            try {
                await api.delete(`/admin/products/${editingId}/gallery/${entry.id}/`);
                toast.success('Image removed');
            } catch {
                toast.error('Failed to remove image');
                return;
            }
        }
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGalleryUpload = async () => {
        if (!editingId) return;
        const newEntries = galleryImages.filter(e => !e.isExisting);
        if (newEntries.length === 0) {
            toast('No new images to upload');
            return;
        }
        setGalleryLoading(true);
        try {
            const payload = new FormData();
            newEntries.forEach((entry, idx) => {
                if (entry.file) {
                    payload.append('images', entry.file);
                    payload.append(`alt_text_${idx}`, entry.alt_text);
                    payload.append(`sort_order_${idx}`, String(entry.sort_order));
                }
            });
            await api.post(`/admin/products/${editingId}/gallery/`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`${newEntries.length} image(s) uploaded`);
            fetchGallery(editingId);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to upload images');
        } finally {
            setGalleryLoading(false);
        }
    };

    // Variant handlers
    const resetVariantForm = () => {
        setVariantForm(emptyVariant);
        setEditingVariantId(null);
        setShowVariantForm(false);
        setVariantEntries([]);
        setShowColorPicker(false);
    };

    const openVariantEdit = (v: ProductVariant) => {
        setVariantForm({
            size: v.size,
            color: v.color,
            color_code: v.color_code,
            sku: v.sku,
            price_override: v.price_override || '',
            stock: v.stock,
            image: null,
            is_active: v.is_active,
        });
        setEditingVariantId(v.id);
        setShowVariantForm(true);
    };

    const handleVariantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        if (!variantForm.size.trim() && !variantForm.color.trim()) {
            toast.error('Enter at least size or color');
            return;
        }
        setVariantSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('size', variantForm.size);
            payload.append('color', variantForm.color);
            payload.append('color_code', variantForm.color_code);
            payload.append('sku', variantForm.sku);
            payload.append('stock', String(variantForm.stock));
            payload.append('is_active', String(variantForm.is_active));
            if (variantForm.price_override) payload.append('price_override', variantForm.price_override);
            if (variantForm.image) payload.append('image', variantForm.image);

            if (editingVariantId) {
                await api.patch(`/admin/products/${editingId}/variants/${editingVariantId}/`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Variant updated');
            } else {
                await api.post(`/admin/products/${editingId}/variants/`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Variant added');
            }
            resetVariantForm();
            fetchVariants(editingId);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save variant');
        } finally {
            setVariantSubmitting(false);
        }
    };

    const handleVariantDelete = async (variantId: number) => {
        if (!window.confirm('Delete this variant?')) return;
        try {
            await api.delete(`/admin/products/${editingId}/variants/${variantId}/`);
            toast.success('Variant deleted');
            fetchVariants(editingId!);
        } catch {
            toast.error('Failed to delete variant');
        }
    };

    // Multi-variant entry handlers
    const addVariantEntry = () => {
        if (!bulkVariantColorName.trim()) {
            toast.error('Select or enter a color name first');
            return;
        }
        const newEntry: VariantEntry = {
            tempId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
            color: bulkVariantColorName,
            color_code: bulkVariantColor,
            size: '',
            price_override: '',
            stock: 0,
            sku: '',
            is_active: true,
            image: null,
        };
        setVariantEntries(prev => [...prev, newEntry]);
    };

    const updateVariantEntry = (tempId: string, field: keyof VariantEntry, value: any) => {
        setVariantEntries(prev => prev.map(e => e.tempId === tempId ? { ...e, [field]: value } : e));
    };

    const removeVariantEntry = (tempId: string) => {
        setVariantEntries(prev => prev.filter(e => e.tempId !== tempId));
    };

    const handleBulkVariantsSubmit = async () => {
        if (!editingId) return;
        const valid = variantEntries.filter(e => e.size.trim() !== '');
        if (valid.length === 0) {
            toast.error('Add at least one size entry');
            return;
        }
        setVariantSubmitting(true);
        let successCount = 0;
        for (const entry of valid) {
            try {
                const payload = new FormData();
                payload.append('size', entry.size);
                payload.append('color', entry.color);
                payload.append('color_code', entry.color_code);
                payload.append('sku', entry.sku);
                payload.append('stock', String(entry.stock));
                payload.append('is_active', String(entry.is_active));
                if (entry.price_override) payload.append('price_override', entry.price_override);
                if (entry.image) payload.append('image', entry.image);
                await api.post(`/admin/products/${editingId}/variants/`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch { /* skip failures */ }
        }
        if (successCount > 0) {
            toast.success(`${successCount} variant(s) added`);
            setVariantEntries([]);
            fetchVariants(editingId);
        } else {
            toast.error('Failed to add variants');
        }
        setVariantSubmitting(false);
    };

    const pickColorPreset = (name: string, code: string) => {
        setBulkVariantColorName(name);
        setBulkVariantColor(code);
        setShowColorPicker(false);
    };

    if (loading && products.length === 0) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error && products.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchData} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-600" /> Products
                </h1>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showForm ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                    <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Product' : 'New Product'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">-- Select --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                            <select name="brand" value={form.brand} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="">-- Select --</option>
                                {brands.filter(b => b.is_active).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price</label>
                            <input type="number" step="0.01" name="compare_price" value={form.compare_price} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Retail Price (Cost)
                                <span className="text-xs text-gray-400 ml-1">(for profit calc)</span>
                            </label>
                            <input type="number" step="0.01" name="retail_price" value={form.retail_price} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                            <input type="number" name="stock" value={form.stock} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <input type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="comma, separated" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Featured
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input type="checkbox" name="has_variants" checked={form.has_variants} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Has Variants
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input type="checkbox" name="free_delivery" checked={form.free_delivery} onChange={handleChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Free Delivery
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty for Delivery Charge</label>
                            <input type="number" min="1" name="min_quantity" value={form.min_quantity} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge per Block (PKR)</label>
                            <input type="number" step="0.01" min="0" name="delivery_charge" value={form.delivery_charge} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:border-0 file:rounded-lg file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>

                    {/* SEO Section */}
                    <details className="border border-gray-200 rounded-lg overflow-hidden">
                        <summary className="px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2">
                            <Search className="w-4 h-4 text-blue-600" />
                            SEO Settings (Meta Tags)
                        </summary>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                <input type="text" name="meta_title" value={form.meta_title} onChange={handleChange} placeholder="SEO title (overrides product name)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                <textarea name="meta_description" value={form.meta_description} onChange={handleChange} rows={2} placeholder="Brief description for search results" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                                <input type="text" name="meta_keywords" value={form.meta_keywords} onChange={handleChange} placeholder="comma, separated, keywords" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>

                            {/* ─── Google Search Preview ───────────── */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-700">Google Search Preview</h3>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Sponsored &middot; Ad</p>
                                    <p className="text-xs text-gray-600 truncate">{window.location.origin}/product/{form.name.toLowerCase().replace(/\s+/g, '-')}</p>
                                    <p className="text-blue-800 font-medium text-base leading-tight mt-1 hover:underline cursor-pointer line-clamp-2">
                                        {form.meta_title || form.name || 'Product Title — edit above to preview'}
                                    </p>
                                    <p className="text-gray-600 text-sm mt-1 leading-snug line-clamp-2">
                                        {form.meta_description || 'Meta description — edit above to preview'}
                                    </p>
                                </div>
                            </div>

                            {/* ─── SEO Analysis Meter ──────────────── */}
                            {(() => {
                                const titleLen = form.meta_title.length;
                                const descLen = form.meta_description.length;
                                const keywords = form.meta_keywords.split(',').map((k) => k.trim()).filter(Boolean);

                                const getTitleStatus = (): 'good' | 'warning' | 'bad' => {
                                    if (titleLen >= 50 && titleLen <= 60) return 'good';
                                    if (titleLen >= 30 && titleLen <= 70) return 'warning';
                                    return 'bad';
                                };

                                const getDescStatus = (): 'good' | 'warning' | 'bad' => {
                                    if (descLen >= 150 && descLen <= 160) return 'good';
                                    if (descLen >= 120 && descLen <= 300) return 'warning';
                                    return 'bad';
                                };

                                const analysis = [
                                    {
                                        label: 'Title Length',
                                        status: getTitleStatus(),
                                        message: titleLen === 0 ? 'Missing meta title' : `${titleLen} characters (recommended: 50-60)`,
                                    },
                                    {
                                        label: 'Meta Description Length',
                                        status: getDescStatus(),
                                        message: descLen === 0 ? 'Missing meta description' : `${descLen} characters (recommended: 150-160)`,
                                    },
                                    {
                                        label: 'Meta Keywords',
                                        status: keywords.length >= 3 ? 'good' : keywords.length > 0 ? 'warning' : 'bad',
                                        message: keywords.length === 0 ? 'No keywords added' : `${keywords.length} keyword(s) found`,
                                    },
                                    {
                                        label: 'Title Keyword Match',
                                        status: keywords.some((kw) => form.meta_title.toLowerCase().includes(kw.toLowerCase())) ? 'good' : 'bad',
                                        message: keywords.length === 0 ? 'Add keywords to check matching' : keywords.some((kw) => form.meta_title.toLowerCase().includes(kw.toLowerCase())) ? 'Keywords found in title' : 'No keywords in title',
                                    },
                                    {
                                        label: 'Description Keyword Match',
                                        status: keywords.some((kw) => form.meta_description.toLowerCase().includes(kw.toLowerCase())) ? 'good' : 'bad',
                                        message: keywords.length === 0 ? 'Add keywords to check matching' : keywords.some((kw) => form.meta_description.toLowerCase().includes(kw.toLowerCase())) ? 'Keywords found in description' : 'No keywords in description',
                                    },
                                ];

                                const goodCount = analysis.filter((a) => a.status === 'good').length;

                                return (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-sm font-semibold text-gray-700">SEO Analysis</h3>
                                            <span className="text-xs text-gray-400 ml-auto">
                                                {goodCount}/{analysis.length} passed
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {analysis.map((item) => (
                                                <div key={item.label} className="flex items-start gap-3">
                                                    {item.status === 'good' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    ) : item.status === 'warning' ? (
                                                        <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                                        <p className={`text-xs ${item.status === 'good' ? 'text-green-600' : item.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {item.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </details>

                    <div className="flex gap-2">
                        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                        </button>
                        <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                </form>
            )}

            {/* Gallery Images Section */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-blue-600" /> Gallery Images
                        </h2>
                        {editingId ? (
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Add Images
                                    <input type="file" accept="image/*" multiple onChange={handleGalleryFileAdd} className="hidden" />
                                </label>
                                <button
                                    onClick={handleGalleryUpload}
                                    disabled={galleryLoading || galleryImages.filter(e => !e.isExisting).length === 0}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {galleryLoading ? 'Uploading...' : `Upload ${galleryImages.filter(e => !e.isExisting).length} New`}
                                </button>
                            </div>
                        ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Save product first to add gallery images</span>
                        )}
                    </div>

                    {!editingId ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">Gallery images can be added after saving the product.</p>
                            <p className="text-xs text-gray-400 mt-1">Click <strong>"Create Product"</strong> first, then you'll be able to upload images here.</p>
                        </div>
                    ) : galleryLoading && !galleryImages.length ? (
                        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                    ) : galleryImages.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center">No gallery images. Add images above.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {galleryImages.map((entry, idx) => (
                                <div key={idx} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                    <div className="aspect-square relative">
                                        {entry.isExisting ? (
                                            <img src={getImageUrl(entry.image as string)} alt={entry.alt_text} className="w-full h-full object-cover" />
                                        ) : entry.file ? (
                                            <img src={URL.createObjectURL(entry.file)} alt={entry.alt_text} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryEntry(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Remove"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="p-1.5 space-y-1">
                                        {entry.isExisting ? (
                                            <input
                                                type="text"
                                                value={entry.alt_text}
                                                onChange={(e) => updateGalleryEntry(idx, 'alt_text', e.target.value)}
                                                onBlur={async () => {
                                                    if (entry.id) {
                                                        try {
                                                            await api.patch(`/admin/products/${editingId}/gallery/${entry.id}/`, { alt_text: entry.alt_text });
                                                        } catch { /* ignore */ }
                                                    }
                                                }}
                                                placeholder="Alt text"
                                                className="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={entry.alt_text}
                                                onChange={(e) => updateGalleryEntry(idx, 'alt_text', e.target.value)}
                                                placeholder="Alt text"
                                                className="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Variants Section */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Size / Color Variants</h2>
                        {editingId ? (
                            <button
                                onClick={() => { resetVariantForm(); setShowVariantForm(!showVariantForm); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {showVariantForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                {showVariantForm ? 'Cancel' : 'Add Variant'}
                            </button>
                        ) : (
                            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Save product first to add variants</span>
                        )}
                    </div>

                    {/* Create-mode hint */}
                    {!editingId && (
                        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
                            <Package className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">Variants (sizes, colors, stock) can be added after saving the product.</p>
                            <p className="text-xs text-gray-400 mt-1">Click <strong>"Create Product"</strong> first, then you'll be able to add size/color variants here.</p>
                        </div>
                    )}

                    {editingId && (
                        <>
                            {/* Variant Form */}
                            {showVariantForm && (
                                <form onSubmit={handleVariantSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Size</label>
                                            <input
                                                type="text" value={variantForm.size}
                                                onChange={e => setVariantForm(prev => ({ ...prev, size: e.target.value }))}
                                                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="e.g. 42, L, XL"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Color Name</label>
                                            <input
                                                type="text" value={variantForm.color}
                                                onChange={e => setVariantForm(prev => ({ ...prev, color: e.target.value }))}
                                                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="e.g. Red, Black"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Color Code</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color" value={variantForm.color_code}
                                                    onChange={e => setVariantForm(prev => ({ ...prev, color_code: e.target.value }))}
                                                    className="w-10 h-8 border rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text" value={variantForm.color_code}
                                                    onChange={e => setVariantForm(prev => ({ ...prev, color_code: e.target.value }))}
                                                    className="flex-1 px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">SKU</label>
                                            <input
                                                type="text" value={variantForm.sku}
                                                onChange={e => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                                                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="Optional SKU"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Price Override</label>
                                            <input
                                                type="number" step="0.01" value={variantForm.price_override}
                                                onChange={e => setVariantForm(prev => ({ ...prev, price_override: e.target.value }))}
                                                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                placeholder="Leave empty = base price"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Stock</label>
                                            <input
                                                type="number" value={variantForm.stock}
                                                onChange={e => setVariantForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-0.5">Variant Image</label>
                                            <input
                                                type="file" accept="image/*"
                                                onChange={e => setVariantForm(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                                                className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:border-0 file:rounded file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <input
                                                    type="checkbox" checked={variantForm.is_active}
                                                    onChange={e => setVariantForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button type="button" onClick={resetVariantForm} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
                                        <button type="submit" disabled={variantSubmitting} className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                                            {variantSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                            {editingVariantId ? 'Update Variant' : 'Add Variant'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Bulk Variant Entry with Color Palette */}
                            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-800">Bulk Variant Entry (same color, multiple sizes)</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {showColorPicker ? 'Hide' : 'Show'} Color Palette
                                    </button>
                                </div>

                                {/* Color Picker with Preset Palette */}
                                {showColorPicker && (
                                    <div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {COMMON_COLORS.map((c) => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    onClick={() => pickColorPreset(c.name, c.code)}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all ${bulkVariantColor === c.code ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-110'}`}
                                                    style={{ backgroundColor: c.code }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <label className="text-gray-600">Color:</label>
                                                <input
                                                    type="color"
                                                    value={bulkVariantColor}
                                                    onChange={e => { setBulkVariantColor(e.target.value); }}
                                                    className="w-8 h-8 border rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={bulkVariantColor}
                                                    onChange={e => setBulkVariantColor(e.target.value)}
                                                    className="w-20 px-2 py-1 border rounded text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-gray-600">Name:</label>
                                                <input
                                                    type="text"
                                                    value={bulkVariantColorName}
                                                    onChange={e => setBulkVariantColorName(e.target.value)}
                                                    placeholder="e.g. Midnight Blue"
                                                    className="w-36 px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addVariantEntry}
                                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add Entry
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Multi-row Variant Entry Table */}
                                {variantEntries.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-300 bg-gray-100">
                                                        <th className="text-left py-1.5 px-2 font-medium text-gray-600">Color</th>
                                                        <th className="text-left py-1.5 px-2 font-medium text-gray-600">Size</th>
                                                        <th className="text-left py-1.5 px-2 font-medium text-gray-600">SKU</th>
                                                        <th className="text-right py-1.5 px-2 font-medium text-gray-600">Price Override</th>
                                                        <th className="text-right py-1.5 px-2 font-medium text-gray-600">Stock</th>
                                                        <th className="text-center py-1.5 px-2 font-medium text-gray-600 w-10">Active</th>
                                                        <th className="text-center py-1.5 px-2 font-medium text-gray-600 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variantEntries.map((entry) => (
                                                        <tr key={entry.tempId} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                                                            <td className="py-1.5 px-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: entry.color_code }} />
                                                                    <span className="text-gray-700 text-[11px]">{entry.color}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 px-2">
                                                                <input
                                                                    type="text"
                                                                    value={entry.size}
                                                                    onChange={e => updateVariantEntry(entry.tempId, 'size', e.target.value)}
                                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                                    placeholder="e.g. 7, 8, M, L"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 px-2">
                                                                <input
                                                                    type="text"
                                                                    value={entry.sku}
                                                                    onChange={e => updateVariantEntry(entry.tempId, 'sku', e.target.value)}
                                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                                                                    placeholder="Auto if empty"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 px-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={entry.price_override}
                                                                    onChange={e => updateVariantEntry(entry.tempId, 'price_override', e.target.value)}
                                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                                    placeholder="Base price"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 px-2">
                                                                <input
                                                                    type="number"
                                                                    value={entry.stock}
                                                                    onChange={e => updateVariantEntry(entry.tempId, 'stock', parseInt(e.target.value) || 0)}
                                                                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={entry.is_active}
                                                                    onChange={e => updateVariantEntry(entry.tempId, 'is_active', e.target.checked)}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 px-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariantEntry(entry.tempId)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={handleBulkVariantsSubmit}
                                                disabled={variantSubmitting || variantEntries.filter(e => e.size.trim() !== '').length === 0}
                                                className="px-4 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {variantSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                                Save All ({variantEntries.filter(e => e.size.trim() !== '').length} Variants)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Variant List */}
                            {variantsLoading ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
                            ) : variants.length === 0 ? (
                                <p className="text-sm text-gray-400 py-3 text-center">No variants yet. Add one above.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Size</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">Color</th>
                                                <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">SKU</th>
                                                <th className="text-right py-2 px-3 font-medium text-gray-600 text-xs">Price</th>
                                                <th className="text-right py-2 px-3 font-medium text-gray-600 text-xs">Stock</th>
                                                <th className="text-center py-2 px-3 font-medium text-gray-600 text-xs">Active</th>
                                                <th className="text-center py-2 px-3 font-medium text-gray-600 text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map(v => (
                                                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 px-3 font-medium text-gray-800">{v.size || '—'}</td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: v.color_code }} />
                                                            <span className="text-gray-600">{v.color || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500 text-xs font-mono">{v.sku || '—'}</td>
                                                    <td className="py-2 px-3 text-right font-medium">
                                                        {v.price_override ? formatCurrency(v.price_override) : formatCurrency(v.effective_price)}
                                                        {v.price_override && <span className="text-xs text-gray-400 ml-1">(override)</span>}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <span className={`font-medium ${v.stock === 0 ? 'text-red-600' : 'text-gray-900'}`}>{v.stock}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {v.is_active ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => openVariantEdit(v)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleVariantDelete(v.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text" placeholder="Search products..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">All Stock</option>
                    <option value="low">Low Stock (&le;5)</option>
                    <option value="out">Out of Stock</option>
                    <option value="in">In Stock</option>
                </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-3 px-3 font-medium text-gray-500 w-10"></th>
                                <th className="text-left py-3 px-3 font-medium text-gray-500">Product</th>
                                <th className="text-left py-3 px-3 font-medium text-gray-500">Category</th>
                                <th className="text-right py-3 px-3 font-medium text-gray-500">Price</th>
                                <th className="text-right py-3 px-3 font-medium text-gray-500">Stock</th>
                                <th className="text-center py-3 px-3 font-medium text-gray-500">Status</th>
                                <th className="text-center py-3 px-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-2 px-3">
                                        <button onClick={() => toggleRow(product.id)} className="p-1 hover:bg-gray-200 rounded">
                                            {expandedRows.has(product.id) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                        </button>
                                    </td>
                                    <td className="py-2 px-3">
                                        <Link to={`/product/${product.slug}`} className="flex items-center gap-3 group">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                {product.thumbnail ? (
                                                    <img src={getImageUrl(product.thumbnail)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{product.name}</span>
                                        </Link>
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">{product.category_name || '-'}</td>
                                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(product.price)}</td>
                                    <td className="py-2 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{product.stock}</span>
                                            {product.stock === 0 && (
                                                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">OUT</span>
                                            )}
                                            {product.stock > 0 && product.stock <= 5 && (
                                                <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700">LOW</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {product.status === true ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => openEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No products found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}