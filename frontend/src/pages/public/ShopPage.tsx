import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, Star, SlidersHorizontal, X, Heart } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import type { Product, Category, PaginatedResponse } from '@/types';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || '';
    const page = parseInt(searchParams.get('page') || '1');

    const [searchInput, setSearchInput] = useState(search);
    const [showFilters, setShowFilters] = useState(false);
    const { isAuthenticated } = useAuthStore();

    const sortOptions = [
        { value: '', label: 'Default' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'newest', label: 'Newest First' },
        { value: 'name', label: 'Name A-Z' },
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params: any = { page };
                if (search) params.search = search;
                if (category) params.category = category;
                if (sort) {
                    const sortMap: Record<string, string> = {
                        price_low: 'price',
                        price_high: '-price',
                        newest: '-created_at',
                        name: 'name',
                    };
                    params.ordering = sortMap[sort] || sort;
                }
                const { data } = await api.get<PaginatedResponse<Product>>('/products/', { params });
                setProducts(data.results);
                setTotalCount(data.count);
            } catch { }
            setLoading(false);
        };
        fetchProducts();
    }, [search, category, sort, page]);

    useEffect(() => {
        api.get('/categories/').then(({ data }) => {
            setCategories(data.results || data);
        }).catch(() => { });
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

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        if (key !== 'page') params.delete('page');
        setSearchParams(params);
    };

    const clearFilters = () => {
        setSearchParams({});
        setSearchInput('');
    };

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

    const totalPages = Math.ceil(totalCount / 20);

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
                <p className="text-gray-500 mt-1">{totalCount} products found</p>
            </div>

            {/* Search + Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updateParams('search', searchInput)}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={sort}
                    onChange={(e) => updateParams('sort', e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors lg:hidden"
                >
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Filters */}
                <aside className={`lg:w-56 shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
                    <div className="bg-white rounded-xl border p-4 space-y-6">
                        {/* Categories */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => { updateParams('category', ''); setShowFilters(false); }}
                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    All Categories
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { updateParams('category', String(cat.id)); setShowFilters(false); }}
                                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === String(cat.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {cat.name} {cat.product_count !== undefined && <span className="text-gray-400">({cat.product_count})</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active filters */}
                        {(search || category || sort) && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Active Filters</h3>
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                                >
                                    <X className="w-3 h-3" /> Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6 animate-card-stagger">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                                {products.map((product) => (
                                    <Link
                                        key={product.id}
                                        to={`/product/${product.slug}`}
                                        className="group bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                    >
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
                                            <button
                                                onClick={(e) => handleToggleWishlist(e, product.id)}
                                                className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all ${wishlistIds.has(product.id) ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:bg-red-50 hover:text-red-400'
                                                    } shadow-sm`}
                                                title={wishlistIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                            >
                                                <Heart className={`w-4 h-4 ${wishlistIds.has(product.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                        <div className="p-3 lg:p-4">
                                            <p className="text-xs text-gray-500 mb-1 truncate">{product.category_name}</p>
                                            <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{product.name}</h3>
                                            <div className="flex items-center gap-1 mt-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} className={`w-3 h-3 ${star <= Math.round(product.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                                                {product.compare_price && (
                                                    <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compare_price)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => updateParams('page', p.toString())}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}