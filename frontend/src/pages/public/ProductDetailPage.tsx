import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, ShoppingCart, ChevronLeft, Check, Minus, Plus, Heart, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, getImageUrl, formatDate } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Skeleton from '@/components/ui/Skeleton';
import type { Product, Review, ProductVariant } from '@/types';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);

    useEffect(() => {
        setLoading(true);
        setQuantity(1);
        setSelectedVariant(undefined);
        setSelectedColor('');
        setActiveImage(0);
        Promise.all([
            api.get(`/products/${slug}/`).then(({ data }) => setProduct(data)),
            api.get(`/products/${slug}/reviews/`).then(({ data }) => setReviews(data.results || data)).catch((err) => console.error('Failed to fetch reviews:', err)),
        ]).finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setWishlistLoading(true);
        api.get('/wishlist/')
            .then(({ data }) => {
                const items: any[] = data.results || data || [];
                setWishlistIds(new Set(items.map((item: any) => item.product)));
            })
            .catch(() => { })
            .finally(() => setWishlistLoading(false));
    }, [isAuthenticated]);

    const allImages = product ? [
        ...(product.thumbnail_url ? [{ id: -1, image: product.thumbnail_url, is_primary: true }] : []),
        ...product.images,
    ] : [];

    const colorGroups = useMemo(() => {
        if (!product?.variants?.length) return [];
        const map = new Map<string, { color: string; color_code: string; variants: ProductVariant[] }>();
        product.variants.forEach(v => {
            if (!v.is_active) return;
            const key = v.color_code || v.color;
            if (!map.has(key)) {
                map.set(key, { color: v.color, color_code: v.color_code, variants: [] });
            }
            map.get(key)!.variants.push(v);
        });
        return Array.from(map.values());
    }, [product?.variants]);

    const handleAddToCart = async () => {
        if (!product) return;
        setAddingToCart(true);
        try {
            await addToCart(product.id, quantity, selectedVariant);
            toast.success('Added to cart!');
        } catch (err: any) {
            toast.error(err.message);
        }
        setAddingToCart(false);
    };

    const handleToggleWishlist = async () => {
        if (!product) return;
        if (!isAuthenticated) {
            toast.error('Please login to add to wishlist');
            return;
        }
        try {
            if (wishlistIds.has(product.id)) {
                const { data } = await api.get('/wishlist/');
                const items: any[] = data.results || data || [];
                const item = items.find((i: any) => i.product === product.id);
                if (item) {
                    await api.delete(`/wishlist/${item.id}/`);
                    const newSet = new Set(wishlistIds);
                    newSet.delete(product.id);
                    setWishlistIds(newSet);
                    toast.success('Removed from wishlist');
                }
            } else {
                await api.post('/wishlist/', { product: product.id });
                const newSet = new Set(wishlistIds);
                newSet.add(product.id);
                setWishlistIds(newSet);
                toast.success('Added to wishlist!');
            }
        } catch {
            toast.error('Failed to update wishlist');
        }
    };

    const handleBuyNow = async () => {
        if (!product) return;
        setBuyingNow(true);
        try {
            await addToCart(product.id, quantity, selectedVariant);
            navigate('/checkout');
        } catch (err: any) {
            toast.error(err.message);
        }
        setBuyingNow(false);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setSubmittingReview(true);
        try {
            await api.post(`/products/${slug}/reviews/`, {
                product: product.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            toast.success('Review submitted!');
            setReviewForm({ rating: 5, comment: '' });
            const { data } = await api.get(`/products/${slug}/reviews/`);
            setReviews(data.results || data);
        } catch {
            toast.error('Failed to submit review');
        }
        setSubmittingReview(false);
    };

    if (loading) {
        return (
            <div className="grid lg:grid-cols-2 gap-8 animate-page-enter">
                <Skeleton variant="rectangular" className="aspect-square w-full" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
                <Link to="/shop" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">Back to Shop</Link>
            </div>
        );
    }

    return (
        <div>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{product.meta_title || `${product.name} | Shoe Club Pakistan`}</title>
                <meta name="description" content={product.meta_description || product.description} />
                <meta name="keywords" content={product.meta_keywords || `${product.name}, ladies shoes, women footwear Pakistan`} />
                <link rel="canonical" href={`https://sheoclub.vercel.app/product/${product.slug}`} />
                <meta property="og:type" content="product" />
                <meta property="og:title" content={product.meta_title || `${product.name} | Shoe Club Pakistan`} />
                <meta property="og:description" content={product.meta_description || product.description} />
                <meta property="og:url" content={`https://sheoclub.vercel.app/product/${product.slug}`} />
                {allImages[0]?.image && <meta property="og:image" content={getImageUrl(allImages[0].image)} />}
                <meta name="twitter:card" content={allImages[0]?.image ? 'summary_large_image' : 'summary'} />
                <meta name="twitter:title" content={product.meta_title || `${product.name} | Shoe Club Pakistan`} />
                <meta name="twitter:description" content={product.meta_description || product.description} />
                {allImages[0]?.image && <meta name="twitter:image" content={getImageUrl(allImages[0].image)} />}
            </Helmet>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link to="/" className="hover:text-blue-600">Home</Link>
                <span>/</span>
                <Link to="/shop" className="hover:text-blue-600">Shop</Link>
                <span>/</span>
                <Link to={`/shop?category=${product.category_detail?.slug || ''}`} className="hover:text-blue-600">{product.category_name}</Link>
                <span>/</span>
                <span className="text-gray-900">{product.name}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div>
                    <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3">
                        <img
                            src={getImageUrl(allImages[activeImage]?.image || product.thumbnail_url)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex gap-2">
                            {allImages.map((img, i) => (
                                <button
                                    key={img.id}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-blue-500' : 'border-gray-200'}`}
                                >
                                    <img src={getImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">{product.category_name}</p>
                    {product.brand_name && (
                        <p className="text-xs text-gray-500 mb-1">
                            Brand: <span className="font-medium text-gray-700">{product.brand_name}</span>
                        </p>
                    )}
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= Math.round(product.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                        {product.compare_price && (
                            <span className="text-lg text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>
                        )}
                        {product.discount_percentage > 0 && (
                            <span className="bg-red-100 text-red-700 text-sm font-bold px-2.5 py-1 rounded-full">
                                -{product.discount_percentage}% OFF
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

                    {/* Variants — Color Swatches + Grouped Sizes */}
                    {product.variants.length > 0 && (
                        <div className="mb-6 space-y-4">
                            <h3 className="font-semibold text-gray-900">Color</h3>
                            {/* Color Swatches */}
                            <div className="flex flex-wrap gap-2">
                                {colorGroups.map((group) => (
                                    <button
                                        key={group.color_code}
                                        onClick={() => {
                                            setSelectedColor(group.color_code);
                                            // If only one size in this group, auto-select the variant
                                            if (group.variants.length === 1) {
                                                setSelectedVariant(group.variants[0].id);
                                            } else {
                                                setSelectedVariant(undefined);
                                            }
                                        }}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === group.color_code ? 'border-gray-900 ring-2 ring-offset-2 ring-blue-400 scale-110' : 'border-gray-300 hover:scale-110'}`}
                                        style={{ backgroundColor: group.color_code }}
                                        title={group.color}
                                    />
                                ))}
                            </div>

                            {/* Size Selection — only for the selected color */}
                            {selectedColor && (() => {
                                const activeGroup = colorGroups.find(g => g.color_code === selectedColor);
                                if (!activeGroup) return null;
                                return (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Size — {activeGroup.color}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {activeGroup.variants.map((v) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => setSelectedVariant(v.id)}
                                                    className={`min-w-[3.5rem] px-3 py-2 border rounded-lg text-sm font-medium text-center transition-all ${selectedVariant === v.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}`}
                                                >
                                                    {v.size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Selected variant summary */}
                            {selectedVariant && (() => {
                                const v = product.variants.find(v => v.id === selectedVariant);
                                if (!v) return null;
                                return (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                        <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: v.color_code }} />
                                        <span className="font-medium">{v.color} — {v.size}</span>
                                        {v.price_override && (
                                            <span className="text-blue-600 font-semibold ml-auto">{formatCurrency(v.effective_price)}</span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Quantity + Add to Cart + Wishlist */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 font-medium min-w-[40px] text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                className="p-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={addingToCart || product.stock === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {product.stock === 0 ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
                        </button>
                        <button
                            onClick={handleToggleWishlist}
                            disabled={wishlistLoading}
                            className={`p-3 rounded-lg border transition-all ${wishlistIds.has(product.id)
                                ? 'bg-red-50 border-red-200 text-red-500'
                                : 'border-gray-300 text-gray-400 hover:border-red-200 hover:text-red-400'
                                }`}
                            title={wishlistIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart className={`w-5 h-5 ${wishlistIds.has(product.id) ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    {/* Buy Now */}
                    {product.stock > 0 && (
                        <button
                            onClick={handleBuyNow}
                            disabled={buyingNow}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 mb-6"
                        >
                            {buyingNow ? 'Processing...' : 'Buy Now'}
                        </button>
                    )}

                    {/* Features */}
                    <div className="border-t pt-6 space-y-3">
                        {[
                            { icon: ShieldCheck, text: 'Secure checkout with SSL encryption' },
                            { icon: RefreshCw, text: '7-day easy return policy' },
                        ].map((f) => (
                            <div key={f.text} className="flex items-center gap-3 text-sm text-gray-600">
                                <f.icon className="w-4 h-4 text-gray-400" />
                                {f.text}
                            </div>
                        ))}
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {product.tags.map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Review List */}
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <p className="text-gray-500">No reviews yet. Be the first!</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-xl border p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                {review.user_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-sm">{review.user_name}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Review Form */}
                    {isAuthenticated && (
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
                            <form onSubmit={handleReviewSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                                                <Star className={`w-6 h-6 cursor-pointer transition-colors ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                        placeholder="Share your thoughts..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}