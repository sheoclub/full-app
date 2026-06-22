import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare, Clock, CheckCircle, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';
import type { SiteSettings, ContactMessage } from '../../types';
import toast from 'react-hot-toast';

export default function ContactPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const { isAuthenticated } = useAuthStore();
    const [userMessages, setUserMessages] = useState<ContactMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        api.get('/settings/')
            .then((res) => setSettings(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserMessages();
        }
    }, [isAuthenticated]);

    const fetchUserMessages = async () => {
        setLoadingMessages(true);
        try {
            const { data } = await api.get('/user/contact-messages/');
            setUserMessages(data || []);
        } catch {
            // silently fail
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/contact/', form);
            toast.success('Message sent successfully! We will get back to you soon.');
            setForm({ name: '', email: '', subject: '', message: '' });
            // Refresh user messages after sending
            if (isAuthenticated) {
                fetchUserMessages();
            }
        } catch {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        We'd love to hear from you. Get in touch with our team.
                    </p>
                </div>
            </section>

            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                        <div className="space-y-6 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                                    <p className="text-gray-600">{settings?.contact_phone || '+92 300 1234567'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                    <p className="text-gray-600">{settings?.contact_email || 'info@shoeclub.com'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                                    <p className="text-gray-600">
                                        {settings?.contact_address || '123 Main Street, Karachi, Pakistan'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                                    <p className="text-gray-600">Monday - Saturday: 9:00 AM - 8:00 PM</p>
                                    <p className="text-gray-600">Sunday: 10:00 AM - 6:00 PM</p>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Preview */}
                        <div className="bg-gray-50 rounded-2xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Frequently Asked Questions
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">How long does delivery take?</h4>
                                    <p className="text-sm text-gray-500 mt-1">2-5 business days within major cities, 5-7 days for remote areas.</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">What is your return policy?</h4>
                                    <p className="text-sm text-gray-500 mt-1">7-day easy return policy for unworn items in original packaging.</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Do you offer Cash on Delivery?</h4>
                                    <p className="text-sm text-gray-500 mt-1">Yes, we offer COD across all cities in Pakistan.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-sm border p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Write your message here..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> Send Message</>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Response Time */}
                        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>We typically respond within 24 hours during business days.</span>
                        </div>

                        {/* User's Previous Messages - Only when logged in */}
                        {isAuthenticated && (
                            <div className="mt-6 bg-white rounded-2xl shadow-sm border overflow-hidden">
                                <button
                                    onClick={() => setShowMessages(!showMessages)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Your Previous Messages</h3>
                                            <p className="text-xs text-gray-500">
                                                {loadingMessages
                                                    ? 'Loading...'
                                                    : `${userMessages.length} message${userMessages.length !== 1 ? 's' : ''} sent`}
                                            </p>
                                        </div>
                                    </div>
                                    {showMessages ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {showMessages && (
                                    <div className="border-t border-gray-100">
                                        {loadingMessages ? (
                                            <div className="flex items-center justify-center py-10">
                                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                            </div>
                                        ) : userMessages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                                <Inbox className="w-10 h-10 text-gray-300 mb-2" />
                                                <p className="text-gray-500 text-sm">No messages yet</p>
                                                <p className="text-xs text-gray-400">Use the form above to send us a message</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                                {userMessages.map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                                                    >
                                                        <button
                                                            onClick={() => toggleExpand(msg.id)}
                                                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-2 h-2 rounded-full shrink-0 ${msg.reply ? 'bg-green-500' : 'bg-yellow-400'}`} />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{msg.subject || '(No subject)'}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        {formatDate(msg.created_at)} · {msg.reply ? 'Replied' : 'Awaiting reply'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {expandedId === msg.id ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                                            )}
                                                        </button>

                                                        {expandedId === msg.id && (
                                                            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-500 mb-1">Your Message</p>
                                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{msg.message}</p>
                                                                </div>

                                                                {msg.reply ? (
                                                                    <div>
                                                                        <p className="text-xs font-medium text-green-600 mb-1">Admin Reply</p>
                                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-green-50 rounded-lg p-3 border border-green-100">
                                                                            {msg.reply}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                        Awaiting reply from admin
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}