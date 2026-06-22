import { create } from 'zustand';
import api from '@/lib/api';
import type { Cart, CartItem } from '@/types';

interface CartState {
    cart: Cart;
    isLoading: boolean;
    fetchCart: () => Promise<void>;
    addToCart: (productId: number, quantity?: number, variantId?: number) => Promise<void>;
    updateCart: (items: { product_id: number; quantity: number; variant_id?: number }[]) => Promise<void>;
    removeFromCart: (productId: number, variantId?: number) => Promise<void>;
    clearCart: () => void;
}

const emptyCart: Cart = { items: [], total: '0', item_count: 0 };

export const useCartStore = create<CartState>((set) => ({
    cart: emptyCart,
    isLoading: false,

    fetchCart: async () => {
        try {
            const { data } = await api.get('/cart/');
            set({ cart: data, isLoading: false });
        } catch {
            set({ cart: emptyCart, isLoading: false });
        }
    },

    addToCart: async (productId, quantity = 1, variantId) => {
        set({ isLoading: true });
        try {
            await api.post('/cart/add/', {
                product_id: productId,
                quantity,
                variant_id: variantId,
            });
            // Re-fetch full cart after adding to get the correct structure
            const { data } = await api.get('/cart/');
            set({ cart: data, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.error || 'Failed to add to cart';
            throw new Error(message);
        }
    },

    updateCart: async (items) => {
        set({ isLoading: true });
        try {
            await api.post('/cart/update/', { items });
            // Re-fetch full cart after updating
            const { data } = await api.get('/cart/');
            set({ cart: data, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            throw new Error(error.response?.data?.error || 'Failed to update cart');
        }
    },

    removeFromCart: async (productId, variantId) => {
        set({ isLoading: true });
        try {
            await api.post(`/cart/remove/${productId}/`, { variant_id: variantId });
            // Re-fetch full cart after removing
            const { data } = await api.get('/cart/');
            set({ cart: data, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    clearCart: () => set({ cart: emptyCart }),
}));