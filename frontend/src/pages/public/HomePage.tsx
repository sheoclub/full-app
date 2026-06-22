import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Star, Truck, ShieldCheck, RefreshCw, HeadphonesIcon, ShoppingBag, Heart } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import type { Banner, Product, SiteSettings, Announcement } from '@/types';
import toast from 'react-hot-toast';

export default function HomePage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [featured, setFeatured] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [onSale, setOnSale] = useState<Product[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        Promise.all([
            api.get('/banners/').then(r => setBanners(r.data.results || r.data)),
            api.get('/products/featured/').then(r => setFeatured(r.data.results || r.data)),
            api.get('/products/new_arrivals/').then(r => setNewArrivals(r.data.results || r.data)),
            api.get('/products/on_sale/').then(r => setOnSale(r.data.results || r.data)),
            api.get('/settings/').then(r => setSettings(r.data)),
            api.get('/announcements/').catch(() => ({ data: [] })).then((r: any) => setAnnouncements(r.data.results || r.data)),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        api.get('/wishlist/')
            .then(({ data }) => {
                const items: any[] = data.results || data || [];
                setWishlistIds(new Set(items.map((item: any) => item.product)));
            })
            .catch(() => { });
    }, [isAuthenticated]);

    // Auto-slide
    useEffect(() => {
        if (banners.length <= 1) return;
        const t = setInterval(() => setCurrentSlide((prev) => (prev + 1) % banners.length), 5000);
        return () => clearInterval(t);
    }, [banners.length]);

    const activeBanners = banners.filter(b => b.active && b.banner_type === 'hero');

    const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Please login to add to wishlist');
            return;
        }
        try {
            if (wishlistIds.has(productId)) {
                const { data } = await api.get('/wishlist/');
                const items: any[] = data.results || data || [];
                const item = items.find((i: any) => i.product === productId);
                if (item) {
                    await api.delete(`/wishlist/${item.id}/`);
                    const newSet = new Set(wishlistIds);
                    newSet.delete(productId);
                    setWishlistIds(newSet);
                    toast.success('Removed from wishlist');
                }
            } else {
                await api.post('/wishlist/', { product: productId });
                const newSet = new Set(wishlistIds);
                newSet.add(productId);
                setWishlistIds(newSet);
                toast.success('Added to wishlist!');
            }
        } catch {
            toast.error('Failed to update wishlist');
        }
    };

    const ProductCard = ({ product }: { product: Product }) => (
        <Link to={`/product/${product.slug}`} className="group bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="aspect-square bg-gray-50 overflow-hidden relative">
                <img
                    src={getImageUrl(product.thumbnail_url || product.thumbnail)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.discount_percentage > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{product.discount_percentage}%
                    </span>
                )}
                {product.is_featured && (
                    <span className="absolute top-2 right-8 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Featured
                    </span>
                )}
                <button
                    onClick={(e) => handleToggleWishlist(e, product.id)}
                    className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all ${wishlistIds.has(product.id)
                            ? 'bg-red-50 text-red-500'
                            : 'bg-white/80 text-gray-400 hover:bg-red-50 hover:text-red-400'
                        } shadow-sm`}
                    title={wishlistIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart className={`w-4 h-4 ${wishlistIds.has(product.id) ? 'fill-current' : ''}`} />
                </button>
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(product.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">({product.review_count})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                    {product.compare_price && (
                        <span className="text-sm text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>
                    )}
                </div>
            </div>
        </Link>
    );

    if (loading) {
        return (
            <div className="space-y-8 animate-page-enter">
                {/* Hero skeleton */}
                <div className="h-[300px] lg:h-[450px] bg-gray-200 rounded-2xl shimmer" />
                <h2 className="text-2xl font-bold">
                    <div className="h-8 bg-gray-200 rounded w-48 shimmer" />
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-card-stagger">
                    {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                </div>
                <h2 className="text-2xl font-bold">
                    <div className="h-8 bg-gray-200 rounded w-48 shimmer" />
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-card-stagger">
                    {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Announcements */}
            {announcements.filter(a => a.active).slice(0, 1).map((ann) => (
                <div key={ann.id} className={`rounded-xl p-4 text-center text-sm font-medium ${ann.is_flash_sale ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    {ann.is_flash_sale && <span className="mr-2">⚡</span>}
                    {ann.message}
                </div>
            ))}

            {/* Hero Carousel */}
            {activeBanners.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden h-[250px] sm:h-[350px] lg:h-[500px]">
                    {activeBanners.map((banner, i) => (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img src={getImageUrl(banner.image)} alt={banner.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 text-white">
                                <h2 className="text-2xl lg:text-4xl font-bold mb-2">{banner.title}</h2>
                                {banner.subtitle && <p className="text-sm lg:text-lg text-gray-200 mb-4">{banner.subtitle}</p>}
                                <Link to="/shop" className="inline-flex items-center gap-1 px-5 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm">
                                    Shop Now <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {activeBanners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Products */}
            {featured.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Featured Products</h2>
                            <p className="text-gray-500 mt-1">Curated just for you</p>
                        </div>
                        <Link to="/shop?sort=featured" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">New Arrivals</h2>
                            <p className="text-gray-500 mt-1">Fresh drops</p>
                        </div>
                        <Link to="/shop?sort=newest" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {/* On Sale */}
            {onSale.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">On Sale</h2>
                            <p className="text-gray-500 mt-1">Best deals</p>
                        </div>
                        <Link to="/shop?sort=price_low" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {onSale.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {/* Features */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { icon: Truck, title: 'Free Delivery', desc: 'Orders over Rs. 2,000' },
                    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
                    { icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
                    { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Dedicated support team' },
                ].map((f) => (
                    <div key={f.title} className="bg-white rounded-xl border p-4 lg:p-6 text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <f.icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{f.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* About Section */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 lg:p-10">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{settings?.site_name || 'Shoe Club'}</h2>
                        <p className="text-gray-600 leading-relaxed mb-6">{settings?.about_text || 'Your premium destination for quality footwear. Step into style with our curated collection of sneakers, formal shoes, and casual wear.'}</p>
                        <Link to="/about" className="inline-flex items-center gap-1 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm">
                            Learn More <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">Why Shop With Us?</h3>
                        <ul className="space-y-3">
                            {['Premium quality footwear', 'Authentic products guaranteed', 'Fast shipping across Pakistan', 'Easy 7-day returns', 'Dedicated customer support'].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-gray-600">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="text-center py-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Ready to find your perfect pair?</h2>
                <p className="text-gray-500 mb-6">Browse our full collection and step up your style game.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200">
                    <ShoppingBag className="w-5 h-5" /> Start Shopping
                </Link>
            </section>
        </div>
    );
}