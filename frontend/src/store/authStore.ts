import { create } from 'zustand';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    initialLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: { email: string; username: string; first_name: string; last_name: string; phone: string; password: string; confirm_password: string }) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    initialLoading: !!localStorage.getItem('access_token'),

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const { data } = await api.post('/auth/login/', { email, password });
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            set({ user: data.user, isAuthenticated: true, isLoading: false, initialLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            const message = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Login failed';
            throw new Error(message);
        }
    },

    signup: async (formData) => {
        set({ isLoading: true });
        try {
            const { data } = await api.post('/auth/signup/', formData);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            set({ isLoading: false });
            const errData = error.response?.data;
            let message = 'Signup failed';
            if (errData) {
                const firstKey = Object.keys(errData)[0];
                message = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
            }
            throw new Error(message);
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, initialLoading: false });
    },

    loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ initialLoading: false });
            return;
        }
        try {
            const { data } = await api.get('/auth/me/');
            set({ user: data, isAuthenticated: true, initialLoading: false });
        } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, initialLoading: false });
        }
    },

    updateProfile: async (profileData) => {
        const { data } = await api.patch('/user/profile/', profileData);
        set({ user: data });
    },

    changePassword: async (oldPassword, newPassword) => {
        await api.post('/user/change-password/', {
            old_password: oldPassword,
            new_password: newPassword,
        });
    },
}));