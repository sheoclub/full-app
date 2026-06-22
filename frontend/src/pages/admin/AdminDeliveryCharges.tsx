import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { DeliveryCharge, DeliveryChargeTier, ProvinceOption } from '@/types';
import { Loader2, AlertCircle, Plus, X, Send, Truck, ToggleLeft, ToggleRight, Trash2, Pencil, ChevronDown, ChevronRight, Layers, Globe, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDeliveryCharges() {
    const [charges, setCharges] = useState<DeliveryCharge[]>([]);
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedTiers, setExpandedTiers] = useState<Set<number>>(new Set());
    const [provinceFilter, setProvinceFilter] = useState('');

    // Tier form state
    const [tierChargeId, setTierChargeId] = useState<number | null>(null);
    const [tierMinQty, setTierMinQty] = useState('');
    const [tierMaxQty, setTierMaxQty] = useState('');
    const [tierCharge, setTierCharge] = useState('');
    const [tierSubmitting, setTierSubmitting] = useState(false);

    // Main delivery charge form state
    const [formProvince, setFormProvince] = useState('');
    const [formCity, setFormCity] = useState('');
    const [formCharge, setFormCharge] = useState('');
    const [formMinFree, setFormMinFree] = useState('');
    const [formActive, setFormActive] = useState(true);

    const fetchProvinces = async () => {
        try {
            const { data } = await api.get<ProvinceOption[]>('/delivery-charges/provinces/');
            setProvinces(data);
        } catch (_e) {
            // fallback
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = provinceFilter ? `?province=${encodeURIComponent(provinceFilter)}` : '';
            const { data } = await api.get<DeliveryCharge[]>(`/admin/delivery-charges/${params}`);
            setCharges(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch delivery charges');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProvinces();
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [provinceFilter]);

    const resetForm = () => {
        setFormProvince('');
        setFormCity('');
        setFormCharge('');
        setFormMinFree('');
        setFormActive(true);
        setEditingId(null);
        setShowForm(false);
    };

    const resetTierForm = () => {
        setTierChargeId(null);
        setTierMinQty('');
        setTierMaxQty('');
        setTierCharge('');
    };

    const openEdit = (item: DeliveryCharge) => {
        setFormProvince(item.province || '');
        setFormCity(item.city);
        setFormCharge(item.charge);
        setFormMinFree(item.min_order_for_free || '');
        setFormActive(item.is_active);
        setEditingId(item.id);
        setShowForm(true);
    };

    // Group charges by province for display
    const groupedCharges = useMemo(() => {
        const map = new Map<string, DeliveryCharge[]>();
        charges.forEach((c) => {
            const p = c.province || 'Unknown';
            if (!map.has(p)) map.set(p, []);
            map.get(p)!.push(c);
        });
        return map;
    }, [charges]);

    const toggleTiers = (id: number) => {
        setExpandedTiers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formProvince) { toast.error('Province is required'); return; }
        if (!formCity.trim()) { toast.error('City is required'); return; }
        if (!formCharge || parseFloat(formCharge) < 0) { toast.error('Valid charge is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                province: formProvince,
                city: formCity.trim(),
                charge: formCharge,
                min_order_for_free: formMinFree || '0',
                is_active: formActive,
            };

            if (editingId) {
                await api.patch(`/admin/delivery-charges/${editingId}/`, payload);
                toast.success('Delivery charge updated');
            } else {
                await api.post('/admin/delivery-charges/', payload);
                toast.success('Delivery charge created');
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save delivery charge');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            const item = charges.find(c => c.id === id);
            if (!item) return;
            await api.patch(`/admin/delivery-charges/${id}/`, { is_active: !item.is_active });
            toast.success('Toggled');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to toggle');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this delivery charge?')) return;
        try {
            await api.delete(`/admin/delivery-charges/${id}/`);
            toast.success('Deleted');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to delete');
        }
    };

    // ─── Tier handlers ─────────────────────────────────────────────

    const handleAddTier = async (deliveryChargeId: number) => {
        if (!tierMinQty || parseInt(tierMinQty) < 0) { toast.error('Valid min quantity is required'); return; }
        if (!tierCharge || parseFloat(tierCharge) < 0) { toast.error('Valid charge is required'); return; }

        setTierSubmitting(true);
        try {
            await api.post(`/admin/delivery-charges/${deliveryChargeId}/tiers/`, {
                min_quantity: parseInt(tierMinQty),
                max_quantity: tierMaxQty ? parseInt(tierMaxQty) : null,
                charge: tierCharge,
            });
            toast.success('Tier added');
            resetTierForm();
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to add tier');
        } finally {
            setTierSubmitting(false);
        }
    };

    const handleDeleteTier = async (tierId: number) => {
        if (!window.confirm('Delete this tier?')) return;
        try {
            await api.delete(`/admin/delivery-charges/tiers/${tierId}/`);
            toast.success('Tier deleted');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to delete tier');
        }
    };

    // ─── Render ────────────────────────────────────────────────────

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
                <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Delivery Charges</h1>
                    <p className="text-sm text-gray-500 mt-1">{charges.length} city/cities configured</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'Add City'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-blue-500" />
                                Province *
                            </label>
                            <select
                                value={formProvince}
                                onChange={(e) => setFormProvince(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Select province</option>
                                {provinces.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <input
                                type="text"
                                value={formCity}
                                onChange={(e) => setFormCity(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. Karachi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formCharge}
                                onChange={(e) => setFormCharge(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. 150"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order for Free Delivery</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formMinFree}
                                onChange={(e) => setFormMinFree(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. 2000 (leave 0 for no free delivery)"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formActive}
                                    onChange={(e) => setFormActive(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                            Cancel / Clear Form
                        </button>
                        <button
                            type="submit" disabled={!!submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingId ? 'Update' : 'Create'}
                        </button>
                    </div>
                    {editingId && (
                        <p className="text-xs text-blue-600">
                            Editing: <strong>{formCity}</strong>
                        </p>
                    )}
                </form>
            )}

            {/* Province Filter */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={provinceFilter}
                        onChange={(e) => setProvinceFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="">All Provinces</option>
                        {provinces.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Province / City</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Charge</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-600">Min Free Order</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Effective Charge</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Active</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400">No delivery charges configured</td>
                                </tr>
                            ) : (
                                Array.from(groupedCharges.entries()).map(([province, items]) => (
                                    <React.Fragment key={province}>
                                        {/* Province Group Header */}
                                        <tr className="bg-blue-50/50 border-b border-blue-100">
                                            <td colSpan={6} className="py-2 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-semibold text-blue-800">{province}</span>
                                                    <span className="text-xs text-blue-500 ml-2">({items.length} cities)</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {items.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3 pl-4">
                                                            <Truck className="w-5 h-5 text-blue-500 shrink-0" />
                                                            <span className="text-gray-800 font-medium">{item.city}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.charge)}</td>
                                                    <td className="py-3 px-4 text-right font-mono">
                                                        {item.min_order_for_free && parseFloat(item.min_order_for_free) > 0
                                                            ? formatCurrency(item.min_order_for_free)
                                                            : <span className="text-gray-400 text-xs">—</span>
                                                        }
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {parseFloat(item.effective_charge) === 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                Free
                                                            </span>
                                                        ) : (
                                                            <span className="font-mono text-xs">{formatCurrency(item.effective_charge)}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => handleToggle(item.id)}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${item.is_active
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {item.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                            {item.is_active ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => { toggleTiers(item.id); resetTierForm(); setTierChargeId(item.id); }}
                                                                className={`p-1.5 rounded-lg transition-colors ${expandedTiers.has(item.id)
                                                                    ? 'text-purple-600 bg-purple-50'
                                                                    : 'text-purple-500 hover:bg-purple-50'
                                                                    }`}
                                                                title="Manage Tiers"
                                                            >
                                                                <Layers className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEdit(item)}
                                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedTiers.has(item.id) && (
                                                    <tr key={`tiers-${item.id}`}>
                                                        <td colSpan={6} className="bg-gray-50 p-4">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                        <Layers className="w-4 h-4 text-purple-500" />
                                                                        Quantity-Based Tiers for {item.city}
                                                                    </h4>
                                                                    <span className="text-xs text-gray-400">
                                                                        {item.tiers.length} tier(s) configured
                                                                    </span>
                                                                </div>

                                                                {item.tiers.length > 0 ? (
                                                                    <table className="w-full text-xs">
                                                                        <thead>
                                                                            <tr className="border-b border-gray-200">
                                                                                <th className="text-left py-2 px-3 font-medium text-gray-500">Min Qty</th>
                                                                                <th className="text-left py-2 px-3 font-medium text-gray-500">Max Qty</th>
                                                                                <th className="text-right py-2 px-3 font-medium text-gray-500">Charge</th>
                                                                                <th className="text-center py-2 px-3 font-medium text-gray-500">Action</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {item.tiers.map((tier) => (
                                                                                <tr key={tier.id} className="border-b border-gray-100">
                                                                                    <td className="py-2 px-3">{tier.min_quantity}</td>
                                                                                    <td className="py-2 px-3">
                                                                                        {tier.max_quantity !== null ? tier.max_quantity : (
                                                                                            <span className="text-gray-400 italic">Unlimited</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(tier.charge)}</td>
                                                                                    <td className="py-2 px-3 text-center">
                                                                                        <button
                                                                                            onClick={() => handleDeleteTier(tier.id)}
                                                                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                                            title="Delete Tier"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 italic py-2">
                                                                        No quantity tiers configured. The base charge will be used for all quantities.
                                                                    </p>
                                                                )}

                                                                <div className="border-t border-gray-200 pt-3">
                                                                    <h5 className="text-xs font-medium text-gray-600 mb-2">Add New Tier</h5>
                                                                    <div className="flex flex-wrap items-end gap-2">
                                                                        <div className="flex-1 min-w-[100px]">
                                                                            <label className="block text-[10px] text-gray-400 mb-1">Min Qty *</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={tierChargeId === item.id ? tierMinQty : ''}
                                                                                onChange={(e) => { setTierChargeId(item.id); setTierMinQty(e.target.value); }}
                                                                                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-purple-500 outline-none"
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-[100px]">
                                                                            <label className="block text-[10px] text-gray-400 mb-1">Max Qty</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={tierChargeId === item.id ? tierMaxQty : ''}
                                                                                onChange={(e) => { setTierChargeId(item.id); setTierMaxQty(e.target.value); }}
                                                                                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-purple-500 outline-none"
                                                                                placeholder="Leave blank for unlimited"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-[100px]">
                                                                            <label className="block text-[10px] text-gray-400 mb-1">Charge *</label>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                min="0"
                                                                                value={tierChargeId === item.id ? tierCharge : ''}
                                                                                onChange={(e) => { setTierChargeId(item.id); setTierCharge(e.target.value); }}
                                                                                className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-purple-500 outline-none"
                                                                                placeholder="e.g. 100"
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleAddTier(item.id)}
                                                                            disabled={tierSubmitting && tierChargeId === item.id}
                                                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                                                        >
                                                                            {tierSubmitting && tierChargeId === item.id ? (
                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                            ) : (
                                                                                <Plus className="w-3 h-3" />
                                                                            )}
                                                                            Add Tier
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}