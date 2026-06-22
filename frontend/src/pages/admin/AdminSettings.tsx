import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { Loader2, AlertCircle, Save, Settings as SettingsIcon, Upload, Truck, Package, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingsForm {
    site_name: string;
    top_banner_text: string;
    logo_url: string;
    delivery_mode: string;
    bank_name: string;
    account_name: string;
    pkr_rate: string;
    account_number: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
    linkedin_url: string;
    youtube_url: string;
    about_photo_url: string;
    about_text: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
}

const DEFAULT_SETTINGS: SettingsForm = {
    site_name: 'Ladies Shoe Club',
    top_banner_text: 'Flash Sale: Up to 50% off on select styles! New Arrivals Just In!',
    logo_url: '',
    delivery_mode: 'quantity',
    bank_name: 'Femme Bank',
    account_name: 'Ladies Shoe Club',
    pkr_rate: '280',
    account_number: '1234567890',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    about_photo_url: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd50?auto=format&fit=crop&w=1000&q=80',
    about_text: '',
    contact_email: 'contact@ladiesshoeclub.com',
    contact_phone: '+92 300 123 4567',
    contact_address: '',
};

export default function AdminSettings() {
    const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [aboutFile, setAboutFile] = useState<File | null>(null);
    const [aboutPreview, setAboutPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const aboutFileInputRef = useRef<HTMLInputElement>(null);

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<Record<string, string>>('/admin/settings/');
            // Map old DB keys (email/phone) to new keys (contact_email/contact_phone)
            // so existing saved settings still populate the form correctly
            setForm((prev) => ({
                ...prev,
                ...data,
                contact_email: data.contact_email || data.email || prev.contact_email,
                contact_phone: data.contact_phone || data.phone || prev.contact_phone,
                facebook_url: data.facebook_url || data.facebook || prev.facebook_url,
                instagram_url: data.instagram_url || data.instagram || prev.instagram_url,
                twitter_url: data.twitter_url || data.twitter || prev.twitter_url,
                linkedin_url: data.linkedin_url || data.linkedin || prev.linkedin_url,
                youtube_url: data.youtube_url || data.youtube || prev.youtube_url,
            }));
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleAboutPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAboutFile(file);
            setAboutPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            if (logoFile) {
                formData.append('logo_url', logoFile);
            }
            if (aboutFile) {
                formData.append('about_photo_url', aboutFile);
            }
            for (const [key, value] of Object.entries(form)) {
                if (key === 'logo_url' && logoFile) continue;
                if (key === 'about_photo_url' && aboutFile) continue;
                formData.append(key, value);
            }
            await api.post('/admin/settings/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Settings saved successfully');
            setLogoFile(null);
            setAboutFile(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
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
                <button onClick={fetchSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Website Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global site configuration</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b pb-3">
                    <SettingsIcon className="w-5 h-5" />
                    General Settings
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Site Name</label>
                        <input
                            name="site_name"
                            value={form.site_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Top Banner Text</label>
                        <input
                            name="top_banner_text"
                            value={form.top_banner_text}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Logo</label>
                        <div className="flex items-center gap-3">
                            {(logoPreview || form.logo_url) && (
                                <img
                                    src={logoPreview || getImageUrl(form.logo_url)}
                                    alt="Logo preview"
                                    className="h-12 w-auto object-contain border rounded"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {form.logo_url ? 'Change Logo' : 'Upload Logo'}
                                </button>
                                <input
                                    name="logo_url"
                                    value={form.logo_url}
                                    onChange={handleChange}
                                    placeholder="Or paste image URL..."
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Contact Email</label>
                        <input
                            name="contact_email"
                            type="email"
                            value={form.contact_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Contact Phone</label>
                        <input
                            name="contact_phone"
                            value={form.contact_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">About Us Photo</label>
                        <div className="flex items-center gap-3">
                            {(aboutPreview || form.about_photo_url) && (
                                <img
                                    src={aboutPreview || getImageUrl(form.about_photo_url)}
                                    alt="About photo preview"
                                    className="h-16 w-16 rounded-lg object-cover border"
                                />
                            )}
                            <div className="flex-1 space-y-2">
                                <input
                                    ref={aboutFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAboutPhotoChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => aboutFileInputRef.current?.click()}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {form.about_photo_url ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                <input
                                    name="about_photo_url"
                                    value={form.about_photo_url}
                                    onChange={handleChange}
                                    placeholder="Or paste image URL..."
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">About Us Text</label>
                        <textarea
                            name="about_text"
                            value={form.about_text}
                            onChange={(e) => setForm((prev) => ({ ...prev, about_text: e.target.value }))}
                            rows={3}
                            placeholder="Tell your brand story..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Contact Address</label>
                        <input
                            name="contact_address"
                            value={form.contact_address}
                            onChange={handleChange}
                            placeholder="Karachi, Pakistan"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Delivery Charge Mode */}
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b pb-3">
                    <Truck className="w-5 h-5" />
                    Delivery Charge Mode
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label
                        className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${form.delivery_mode === 'quantity'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <input
                            type="radio"
                            name="delivery_mode"
                            value="quantity"
                            checked={form.delivery_mode === 'quantity'}
                            onChange={handleChange}
                            className="mt-1 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                                <Package className="w-5 h-5 text-blue-600" />
                                Per-Block (Quantity Based)
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Delivery charges are calculated per block of items based on each product's
                                minimum quantity and delivery charge. City charges will not apply.
                            </p>
                        </div>
                    </label>

                    <label
                        className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${form.delivery_mode === 'city'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <input
                            type="radio"
                            name="delivery_mode"
                            value="city"
                            checked={form.delivery_mode === 'city'}
                            onChange={handleChange}
                            className="mt-1 w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 font-semibold text-gray-800">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                City-to-City (Province Based)
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Delivery charges are determined by the customer's city and province.
                                Per-product block charges will not apply.
                            </p>
                        </div>
                    </label>
                </div>

                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 border-b pb-3">
                    <SettingsIcon className="w-5 h-5" />
                    Banking & Social
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                        <input
                            name="bank_name"
                            value={form.bank_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Account Name</label>
                        <input
                            name="account_name"
                            value={form.account_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Account Number</label>
                        <input
                            name="account_number"
                            value={form.account_number}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">PKR Conversion Rate</label>
                        <input
                            name="pkr_rate"
                            value={form.pkr_rate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Facebook</label>
                        <input
                            name="facebook_url"
                            value={form.facebook_url}
                            onChange={handleChange}
                            placeholder="https://facebook.com/..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Instagram</label>
                        <input
                            name="instagram_url"
                            value={form.instagram_url}
                            onChange={handleChange}
                            placeholder="https://instagram.com/..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Twitter</label>
                        <input
                            name="twitter_url"
                            value={form.twitter_url}
                            onChange={handleChange}
                            placeholder="https://twitter.com/..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</label>
                        <input
                            name="linkedin_url"
                            value={form.linkedin_url}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">YouTube</label>
                        <input
                            name="youtube_url"
                            value={form.youtube_url}
                            onChange={handleChange}
                            placeholder="https://youtube.com/..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-3 border-t">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}