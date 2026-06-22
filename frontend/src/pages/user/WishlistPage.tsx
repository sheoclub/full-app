import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { Heart, ShoppingBag, Trash2, Loader2, AlertCircle, Star } from 'lucide-react';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { WishlistItem } from '@/types';

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);
    const { addToCart } = useCartStore();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/wishlist/');
            setItems(data.results || data || []);
        } catch (err: any) {
            setError('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (item: WishlistItem) => {
        setRemovingId(item.id);
        try {
            await api.delete(`/wishlist/${item.id}/`);
            setItems(prev => prev.filter(i => i.id !== item.id));
            toast.success('Removed from wishlist');
        } catch (err: any) {
            toast.error('Failed to remove item');
        } finally {
            setRemovingId(null);
        }
    };

    const handleAddToCart = async (item: WishlistItem) => {
        try {
            await addToCart(item.product, 1, undefined);
            toast.success(`${item.product_detail?.name || 'Item'} added to cart`);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to add to cart');
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-500 mt-1">Items you've saved for later</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-card-stagger">
                    {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                    <p className="text-gray-500">{error}</p>
                    <button
                        onClick={fetchWishlist}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Try Again
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">Your wishlist is empty</h3>
                    <p className="text-gray-400 mt-1">Save your favourite items here!</p>
                    <Link
                        to="/shop"
                        className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => {
                        const product = item.product_detail;
                        if (!product) return null;
                        const hasDiscount = product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price);

                        return (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-shadow">
                                <Link to={`/product/${product.slug}`} className="block aspect-square bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={getImageUrl(product.thumbnail_url || product.thumbnail)}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {hasDiscount && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                            -{product.discount_percentage}%
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleRemove(item); }}
                                        disabled={removingId === item.id}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                                        title="Remove from wishlist"
                                    >
                                        {removingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                        ) : (
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        )}
                                    </button>
                                </Link>

                                <div className="p-4">
                                    <Link to={`/product/${product.slug}`}>
                                        <h3 className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {product.average_rating > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                            {renderStars(product.average_rating)}
                                            <span className="text-xs text-gray-400 ml-1">({product.review_count})</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                        <div>
                                            <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                                            {hasDiscount && (
                                                <span className="text-xs text-gray-400 line-through ml-2">{formatCurrency(product.compare_price!)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={product.stock === 0}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                        <Link
                                            to={`/product/${product.slug}`}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}