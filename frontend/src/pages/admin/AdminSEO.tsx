import { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface SEOForm {
    site_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image: string;
    og_title: string;
    og_description: string;
    canonical_url: string;
    google_analytics_id: string;
    shop_title: string;
    shop_description: string;
    about_title: string;
    about_description: string;
    contact_title: string;
    contact_description: string;
    shipping_title: string;
    shipping_description: string;
    return_title: string;
    return_description: string;
    track_title: string;
    track_description: string;
}

const DEFAULT_FORM: SEOForm = {
    site_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    google_analytics_id: '',
    shop_title: '',
    shop_description: '',
    about_title: '',
    about_description: '',
    contact_title: '',
    contact_description: '',
    shipping_title: '',
    shipping_description: '',
    return_title: '',
    return_description: '',
    track_title: '',
    track_description: '',
};

const PAGE_SEO_FIELDS = [
    { label: 'Shop Page', title: 'shop_title', description: 'shop_description' },
    { label: 'About Page', title: 'about_title', description: 'about_description' },
    { label: 'Contact Page', title: 'contact_title', description: 'contact_description' },
    { label: 'Shipping Info Page', title: 'shipping_title', description: 'shipping_description' },
    { label: 'Return Policy Page', title: 'return_title', description: 'return_description' },
    { label: 'Track Order Page', title: 'track_title', description: 'track_description' },
] as const;

interface AnalysisItem {
    label: string;
    status: 'good' | 'warning' | 'bad';
    message: string;
}

export default function AdminSEO() {
    const [form, setForm] = useState<SEOForm>(DEFAULT_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchSEO = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/admin/seo/');
            setForm({ ...DEFAULT_FORM, ...res.data });
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load SEO settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSEO();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/seo/', form);
            toast.success('SEO settings saved');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save SEO settings');
        } finally {
            setSaving(false);
        }
    };

    // ─── Analysis ─────────────────────────────────────────────

    const titleLen = form.site_title.length;
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

    const analysis: AnalysisItem[] = [
        {
            label: 'Title Length',
            status: getTitleStatus(),
            message:
                titleLen === 0
                    ? 'Missing title tag'
                    : `${titleLen} characters (recommended: 50-60)`,
        },
        {
            label: 'Meta Description Length',
            status: getDescStatus(),
            message:
                descLen === 0
                    ? 'Missing meta description'
                    : `${descLen} characters (recommended: 150-160)`,
        },
        {
            label: 'Meta Keywords',
            status: keywords.length >= 3 ? 'good' : keywords.length > 0 ? 'warning' : 'bad',
            message:
                keywords.length === 0
                    ? 'No keywords added'
                    : `${keywords.length} keyword(s) found`,
        },
        {
            label: 'Title Keyword Match',
            status: keywords.some((kw) => form.site_title.toLowerCase().includes(kw.toLowerCase()))
                ? 'good'
                : 'bad',
            message:
                keywords.length === 0
                    ? 'Add keywords to check matching'
                    : keywords.some((kw) => form.site_title.toLowerCase().includes(kw.toLowerCase()))
                        ? 'Keywords found in title'
                        : 'No keywords in title',
        },
        {
            label: 'Description Keyword Match',
            status: keywords.some((kw) => form.meta_description.toLowerCase().includes(kw.toLowerCase()))
                ? 'good'
                : 'bad',
            message:
                keywords.length === 0
                    ? 'Add keywords to check matching'
                    : keywords.some((kw) => form.meta_description.toLowerCase().includes(kw.toLowerCase()))
                        ? 'Keywords found in description'
                        : 'No keywords in description',
        },
        {
            label: 'Open Graph Image',
            status: form.og_image ? 'good' : 'bad',
            message: form.og_image ? 'OG image set' : 'Missing Open Graph image',
        },
    ];

    const siteUrl = window.location.origin || 'https://example.com';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700">{error}</p>
                    <button onClick={fetchSEO} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">SEO Settings</h1>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ─── Form ────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Meta Tags</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Site Title</label>
                                <input
                                    type="text"
                                    name="site_title"
                                    value={form.site_title}
                                    onChange={handleChange}
                                    placeholder="My Store | Best Shoes Online"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <p className={`text-xs mt-1 ${titleLen > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {titleLen}/60 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                <textarea
                                    name="meta_description"
                                    value={form.meta_description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Discover premium quality shoes at affordable prices..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                                <p className={`text-xs mt-1 ${descLen > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {descLen}/160 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Meta Keywords <span className="text-gray-400 font-normal">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    name="meta_keywords"
                                    value={form.meta_keywords}
                                    onChange={handleChange}
                                    placeholder="shoes, sneakers, footwear, online shopping"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                                <input
                                    type="url"
                                    name="canonical_url"
                                    value={form.canonical_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Public Page SEO</h2>
                        <p className="text-sm text-gray-500 mb-4">Control title and meta description for main Google-indexed pages. Leave blank to use safe defaults.</p>
                        <div className="space-y-5">
                            {PAGE_SEO_FIELDS.map((field) => (
                                <div key={field.title} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3">{field.label}</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            name={field.title}
                                            value={form[field.title]}
                                            onChange={handleChange}
                                            placeholder={`${field.label} title for Google`}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <textarea
                                            name={field.description}
                                            value={form[field.description]}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder={`${field.label} meta description`}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Open Graph</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
                                <input
                                    type="text"
                                    name="og_title"
                                    value={form.og_title}
                                    onChange={handleChange}
                                    placeholder="Leave blank to use Site Title"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
                                <textarea
                                    name="og_description"
                                    value={form.og_description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Leave blank to use Meta Description"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
                                <input
                                    type="url"
                                    name="og_image"
                                    value={form.og_image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/images/og-image.jpg"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Google Analytics</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking ID</label>
                            <input
                                type="text"
                                name="google_analytics_id"
                                value={form.google_analytics_id}
                                onChange={handleChange}
                                placeholder="G-XXXXXXXXXX"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Preview & Analysis ──────────────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Google Snippet Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Search className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-700">Google Search Preview</h3>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Sponsored &middot; Ad</p>
                            <p className="text-xs text-gray-600 truncate">{siteUrl}</p>
                            <p className="text-blue-800 font-medium text-base leading-tight mt-1 hover:underline cursor-pointer line-clamp-2">
                                {form.site_title || 'Site Title — edit above to preview'}
                            </p>
                            <p className="text-gray-600 text-sm mt-1 leading-snug line-clamp-2">
                                {form.meta_description || 'Meta description — edit above to preview'}
                            </p>
                        </div>
                    </div>

                    {/* SEO Meter */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">SEO Analysis</h3>
                            <span className="text-xs text-gray-400 ml-auto">
                                {analysis.filter((a) => a.status === 'good').length}/{analysis.length} passed
                            </span>
                        </div>

                        <div className="space-y-3">
                            {analysis.map((item) => (
                                <div key={item.label} className="flex items-start gap-3">
                                    {item.status === 'good' ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : item.status === 'warning' ? (
                                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
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
                </div>
            </div>
        </div>
    );
}