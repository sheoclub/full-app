import { create } from 'zustand';

interface UIState {
    isMobileMenuOpen: boolean;
    isMobileNavOpen: boolean;
    toggleMobileMenu: () => void;
    toggleMobileNav: () => void;
    closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    isMobileNavOpen: false,
    toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
    toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
    closeMobileMenu: () => set({ isMobileMenuOpen: false, isMobileNavOpen: false }),
}));