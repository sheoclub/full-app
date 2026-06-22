import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, ThumbsDown, Trash2, Search, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';
import toast from 'react-hot-toast';

export default function AdminReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/reviews/');
            setReviews(data.results || data);
        } catch {
            setError('Failed to load reviews');
        }
        setLoading(false);
    };

    const handleAction = async (reviewId: number, action: 'approve' | 'reject' | 'delete') => {
        setActionLoading(reviewId);
        try {
            await api.post('/admin/reviews/', { review_id: reviewId, action });
            const actionMsg = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'deleted';
            toast.success(`Review ${actionMsg}`);
            fetchReviews();
        } catch {
            toast.error('Failed to perform action');
        }
        setActionLoading(null);
    };

    const filteredReviews = reviews.filter((r) => {
        const matchesSearch =
            r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(r.rating).includes(searchTerm) ||
            r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'approved' && r.is_approved) ||
            (filterStatus === 'pending' && !r.is_approved);
        return matchesSearch && matchesStatus;
    });

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="animate-page-enter">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {reviews.length} total
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user, rating or comment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'approved', 'pending'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews list */}
            {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {review.user_name || 'Anonymous'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.is_approved
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {review.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDate(review.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                                        {review.comment || 'No comment'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>Review #{review.id}</span>
                                        <span>·</span>
                                        <span>Product ID: {review.product}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {!review.is_approved && (
                                        <button
                                            onClick={() => handleAction(review.id!, 'approve')}
                                            disabled={actionLoading === review.id}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Approve"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                    )}
                                    {review.is_approved && (
                                        <button
                                            onClick={() => handleAction(review.id!, 'reject')}
                                            disabled={actionLoading === review.id}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Reject / Unapprove"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleAction(review.id!, 'delete')}
                                        disabled={actionLoading === review.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}