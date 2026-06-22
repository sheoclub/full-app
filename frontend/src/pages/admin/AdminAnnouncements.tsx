import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Announcement } from '@/types';
import { Loader2, AlertCircle, Plus, X, Send, Megaphone, ToggleLeft, ToggleRight, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');
    const [formFlashSale, setFormFlashSale] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<Announcement[]>('/admin/announcements/');
            setAnnouncements(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setFormMessage('');
        setFormFlashSale(false);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formMessage.trim()) { toast.error('Message is required'); return; }
        setSubmitting(true);
        try {
            await api.post('/admin/announcements/', { message: formMessage, is_flash_sale: formFlashSale });
            toast.success('Announcement created');
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await api.post(`/admin/announcements/${id}/toggle/`);
            toast.success('Toggled');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to toggle');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/admin/announcements/${id}/`);
            toast.success('Deleted');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to delete');
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
                    <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
                    <p className="text-sm text-gray-500 mt-1">{announcements.length} announcement(s)</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Announcement'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="Announcement text..."
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formFlashSale}
                            onChange={(e) => setFormFlashSale(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Mark as Flash Sale
                        </div>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Send className="w-4 h-4" />
                            Post
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Message</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Flash Sale</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Active</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400">No announcements</td>
                                </tr>
                            ) : (
                                announcements.map((a) => (
                                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-start gap-3">
                                                <Megaphone className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                                <span className="text-gray-800">{a.message}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {a.is_flash_sale ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                    <Sparkles className="w-3 h-3" />
                                                    Sale
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleToggle(a.id)}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${a.active
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {a.active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                {a.active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(a.created_at)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}