import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWishlistStore } from './wishlistStore';

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin' | 'superadmin';
  avatar: string | null;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, access: string, refresh: string) => void;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, access, refresh) =>
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      logout: () => {
        useWishlistStore.getState().clear();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (u) =>
        set((s) => ({ user: s.user ? { ...s.user, ...u } : null })),
    }),
    { name: 'saq-auth' }
  )
);
