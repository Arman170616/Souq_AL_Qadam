import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  slug: string;
  vendorName: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (productId: number) => boolean;
  remove: (productId: number) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some(i => i.productId === item.productId);
        set({ items: exists
          ? get().items.filter(i => i.productId !== item.productId)
          : [...get().items, item],
        });
      },
      has: (productId) => get().items.some(i => i.productId === productId),
      remove: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'saq-wishlist' }
  )
);
