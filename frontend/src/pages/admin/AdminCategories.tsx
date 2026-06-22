import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, Loader2, AlertCircle, Trash2, FolderTree, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Category } from '@/types';
import toast from 'react-hot-toast';

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newSortOrder, setNewSortOrder] = useState(0);
    const [newDiscount, setNewDiscount] = useState(0);
    const [newIsActive, setNewIsActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin/categories/');
            setCategories(data);
        } catch {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) { toast.error('Category name is required'); return; }
        setSubmitting(true);
        try {
            await api.post('/admin/categories/', {
                name: newName,
                description: newDescription,
                sort_order: newSortOrder,
                discount_percentage: newDiscount,
                is_active: newIsActive,
            });
            toast.success('Category created');
            setNewName('');
            setNewDescription('');
            setNewSortOrder(0);
            setNewDiscount(0);
            setNewIsActive(true);
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (cat: Category) => {
        try {
            await api.patch(`/admin/categories/${cat.id}/`, { is_active: !cat.is_active });
            toast.success(`Category ${cat.is_active ? 'deactivated' : 'activated'}`);
            fetchCategories();
        } catch {
            toast.error('Failed to update category');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/categories/${id}/`);
            toast.success('Category deleted');
            fetchCategories();
        } catch {
            toast.error('Failed to delete category');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-gray-500">{error}</p>
            <button onClick={fetchCategories} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Try Again</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FolderTree className="w-6 h-6 text-green-600" /> Categories
            </h1>

            {/* Add Category Form */}
            <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Add Category</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input type="text" value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" value={newSortOrder} onChange={e => setNewSortOrder(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <input type="number" step="0.01" min="0" max="100" value={newDiscount} onChange={e => setNewDiscount(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={newIsActive} onChange={e => setNewIsActive(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        Active
                    </label>
                    <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
                        <Plus className="w-4 h-4" /> {submitting ? 'Adding...' : 'Add Category'}
                    </button>
                </div>
            </form>

            {/* Categories Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Discount</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Active</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Products</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-500">#{cat.id}</td>
                                    <td className="py-3 px-4 font-medium text-gray-900">{cat.name}</td>
                                    <td className="py-3 px-4 text-center">
                                        {cat.discount_percentage && parseFloat(String(cat.discount_percentage)) > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                <Tag className="w-3 h-3" /> {parseFloat(String(cat.discount_percentage))}% OFF
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(cat)}
                                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${cat.is_active
                                                    ? 'text-green-700 bg-green-50 hover:bg-green-100'
                                                    : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                            {cat.product_count ?? 0}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No categories yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}