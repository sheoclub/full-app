import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Minus, Plus, ArrowLeft } from 'lucide-react';
import { CartItemSkeleton } from '@/components/ui/Skeleton';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getImageUrl } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
    const { cart, updateCart, removeFromCart, isLoading } = useCartStore();
    const items = cart.items;
    const loading = isLoading;
    const { isAuthenticated } = useAuthStore();

    const subtotal = items.reduce((sum, item) => sum + Number(item.total_price || item.product.price) * item.quantity, 0);

    const handleQuantityChange = async (productId: number, newQty: number, index: number) => {
        if (newQty < 1) return;
        const stock = items[index].product.stock ?? 99;
        if (newQty > stock) {
            toast.error(`Only ${stock} items available`);
            return;
        }
        const updated = items.map((item, i) =>
            i === index ? { ...item, quantity: newQty } : item
        );
        await updateCart(updated.map((item) => ({ product_id: item.product.id, quantity: item.quantity })));
    };

    const handleRemove = async (productId: number) => {
        await removeFromCart(productId);
        toast.success('Item removed from cart');
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-full max-w-3xl space-y-4 animate-page-enter">
                    {[1, 2, 3].map(i => <CartItemSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
                <p className="text-gray-500">Looks like you haven't added anything yet</p>
                <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                        <p className="text-gray-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
                    </div>
                    <Link
                        to="/shop"
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item, index) => (
                            <div
                                key={`${item.product.id}-${item.variant?.id || 'no-variant'}`}
                                className="bg-white rounded-2xl shadow-sm border p-4 flex gap-4"
                            >
                                <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">
                                    <img
                                        src={getImageUrl(item.product.image)}
                                        alt={item.product.name}
                                        className="w-24 h-24 object-cover rounded-xl"
                                    />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Link
                                                to={`/product/${item.product.slug}`}
                                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                                            >
                                                {item.product.name}
                                            </Link>
                                            {item.variant && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {item.variant.size && `Size: ${item.variant.size}`}
                                                    {item.variant.color && ` | Color: ${item.variant.color}`}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemove(item.product.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, index)}
                                                disabled={item.quantity <= 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, index)}
                                                disabled={item.quantity >= (item.product.stock ?? 99)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(Number(item.total_price || item.product.price) * item.quantity)}
                                            </div>
                                            {item.product.compare_price && Number(item.product.compare_price) > Number(item.product.price) && (
                                                <div className="text-sm text-gray-400 line-through">
                                                    {formatCurrency(Number(item.product.compare_price) * item.quantity)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <hr className="border-gray-200" />
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                            </div>

                            <Link
                                to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
                                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Proceed to Checkout
                            </Link>

                            {!isAuthenticated && (
                                <p className="text-xs text-gray-400 text-center mt-3">
                                    You'll need to log in to complete your order
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}