import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Copy, Check, Eye, EyeOff } from 'lucide-react';
import type { UserNotification } from '../../types';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function MyInboxPage() {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/user/notifications/');
            setNotifications(res.data);
        } catch {
            setError('Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkRead = async (id?: number) => {
        try {
            const payload = id !== undefined ? { id } : { all: true };
            await api.patch('/user/notifications/', payload);
            fetchNotifications();
        } catch {
            // silently fail
        }
    };

    const handleCopyCode = async (notificationId: number, code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedId(notificationId);
            toast.success('Coupon code copied!');
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error('Failed to copy code');
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Inbox</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                            : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => handleMarkRead()}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <div className="text-center py-16">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={fetchNotifications}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Try again
                    </button>
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h2>
                    <p className="text-sm text-gray-500">
                        When you receive coupons or updates, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`rounded-xl border p-4 transition-colors ${n.is_read
                                ? 'bg-white border-gray-200'
                                : 'bg-blue-50 border-blue-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {!n.is_read && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                        )}
                                        <h3 className={`text-sm font-semibold truncate ${n.is_read ? 'text-gray-700' : 'text-gray-900'
                                            }`}>
                                            {n.subject}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{n.body}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs text-gray-400">
                                            {new Date(n.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        {n.coupon_code && (
                                            <span className="inline-flex items-center gap-1 text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                {n.coupon_code}
                                            </span>
                                        )}
                                        {n.coupon_code && (
                                            <button
                                                onClick={() => handleCopyCode(n.id, n.coupon_code!)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Copy coupon code"
                                            >
                                                {copiedId === n.id ? (
                                                    <><Check className="w-3 h-3" /> Copied</>
                                                ) : (
                                                    <><Copy className="w-3 h-3" /> Copy</>
                                                )}
                                            </button>
                                        )}
                                        {n.coupon_discount && (
                                            <span className="text-xs font-medium text-green-700">
                                                {n.coupon_discount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Review section */}
                                    {n.review_detail && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => setExpandedReviewId(expandedReviewId === n.id ? null : n.id)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
                                            >
                                                {expandedReviewId === n.id ? (
                                                    <><EyeOff className="w-3 h-3" /> Hide Review</>
                                                ) : (
                                                    <><Eye className="w-3 h-3" /> View Review</>
                                                )}
                                            </button>
                                            {expandedReviewId === n.id && (
                                                <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg p-3">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {renderStars(n.review_detail.rating)}
                                                        <span className="text-xs text-gray-500 ml-1">
                                                            by {n.review_detail.user_name}
                                                        </span>
                                                    </div>
                                                    {n.review_detail.comment && (
                                                        <p className="text-sm text-gray-700">{n.review_detail.comment}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(n.review_detail.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!n.is_read && (
                                        <button
                                            onClick={() => handleMarkRead(n.id)}
                                            className="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap"
                                        >
                                            Mark read
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}