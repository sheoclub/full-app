import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { ContactMessage } from '@/types';
import { Loader2, AlertCircle, MessageSquare, Mail, User, Reply, CheckCircle, XCircle, Send, Eye, X, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminContactMessages() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [viewingMsg, setViewingMsg] = useState<ContactMessage | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<ContactMessage[]>('/admin/contact-messages/');
            setMessages(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleReply = async (id: number) => {
        if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
        setSendingReply(true);
        try {
            await api.post(`/admin/contact-messages/${id}/reply/`, { reply: replyText });
            toast.success('Reply sent');
            setReplyingId(null);
            setReplyText('');
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    const handleModalReply = async () => {
        if (!viewingMsg || !replyText.trim()) { toast.error('Reply cannot be empty'); return; }
        setSendingReply(true);
        try {
            await api.post(`/admin/contact-messages/${viewingMsg.id}/reply/`, { reply: replyText });
            toast.success('Reply sent');
            setReplyText('');
            fetchData();
            // Update the viewing message with the reply
            setViewingMsg(prev => prev ? { ...prev, reply: replyText } : null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to send reply');
        } finally {
            setSendingReply(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/contact-messages/${id}/delete/`);
            toast.success('Message deleted');
            if (viewingMsg?.id === id) setViewingMsg(null);
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to delete message');
        } finally {
            setDeleting(false);
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
                    <h1 className="text-2xl font-bold text-gray-800">Contact Messages</h1>
                    <p className="text-sm text-gray-500 mt-1">{messages.length} message(s)</p>
                </div>
            </div>

            <div className="space-y-4">
                {messages.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`bg-white rounded-xl shadow-sm border p-5 space-y-3 ${!msg.is_read ? 'ring-2 ring-blue-200' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`p-2 rounded-full shrink-0 ${msg.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                        <MessageSquare className={`w-5 h-5 ${msg.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-800">{msg.user_name || 'Anonymous'}</span>
                                            <span className="text-xs text-gray-400">#{msg.id}</span>
                                            {!msg.is_read && (
                                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">New</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {msg.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {formatDateTime(msg.created_at)}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-gray-700">{msg.subject}</p>
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-3">{msg.message}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => { if (window.confirm('Delete this message?')) handleDelete(msg.id); }}
                                        disabled={deleting}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                        title="Delete message"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setViewingMsg(msg)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                        title="View full details"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                </div>
                            </div>

                            {msg.reply && (
                                <div className="ml-11 pl-4 border-l-2 border-green-300 bg-green-50 rounded-r-lg p-3">
                                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Replied
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{msg.reply}</p>
                                </div>
                            )}

                            {!msg.reply && (
                                <div className="ml-11">
                                    {replyingId === msg.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                rows={3}
                                                placeholder="Type your reply..."
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReply(msg.id)}
                                                    disabled={sendingReply}
                                                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                                                >
                                                    {sendingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    <Send className="w-3 h-3" />
                                                    Send Reply
                                                </button>
                                                <button
                                                    onClick={() => { setReplyingId(null); setReplyText(''); }}
                                                    className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReplyingId(msg.id)}
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <Reply className="w-3 h-3" />
                                            Reply
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ── View Message Modal ────────────────────────────────────────── */}
            {viewingMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingMsg(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-full ${viewingMsg.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                    <MessageSquare className={`w-6 h-6 ${viewingMsg.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Message Details</h2>
                                    <p className="text-xs text-gray-500">#{viewingMsg.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setViewingMsg(null); setReplyText(''); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Sender Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Sender</p>
                                        <p className="text-sm font-medium text-gray-800">{viewingMsg.user_name || 'Anonymous'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-800 break-all">{viewingMsg.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Subject & Date */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Subject</p>
                                    <p className="text-base font-semibold text-gray-800">{viewingMsg.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Date</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDateTime(viewingMsg.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Full Message */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Message</p>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingMsg.message}</p>
                                </div>
                            </div>

                            {/* Existing Reply */}
                            {viewingMsg.reply && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Reply Sent</p>
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-2">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Replied
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingMsg.reply}</p>
                                    </div>
                                </div>
                            )}

                            {/* Reply Form in Modal */}
                            {!viewingMsg.reply && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Send Reply</p>
                                    <div className="space-y-3">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            rows={4}
                                            placeholder="Type your reply here..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleModalReply}
                                                disabled={sendingReply || !replyText.trim()}
                                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-2 transition-colors"
                                            >
                                                {sendingReply && <Loader2 className="w-4 h-4 animate-spin" />}
                                                <Send className="w-4 h-4" />
                                                Send Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => { if (window.confirm('Delete this message?')) handleDelete(viewingMsg.id); }}
                                disabled={deleting}
                                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                            <button
                                onClick={() => { setViewingMsg(null); setReplyText(''); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}