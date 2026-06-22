import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, ChevronDown, ChevronUp, Loader2, AlertCircle, Inbox } from 'lucide-react';
import type { ContactMessage } from '@/types';

export default function MyMessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/user/contact-messages/');
            setMessages(data || []);
        } catch (err: any) {
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Messages</h1>
                <p className="text-gray-500 mt-1">View your contact messages and admin replies</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="font-semibold text-gray-900">Messages</h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={fetchMessages}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 mb-1">No messages yet</p>
                        <p className="text-sm text-gray-400 mb-4">Contact us if you have any questions</p>
                        <Link
                            to="/contact"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Send a Message
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg) => (
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
                                        {/* User Message */}
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-1">Your Message</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{msg.message}</p>
                                        </div>

                                        {/* Admin Reply */}
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
        </div>
    );
}