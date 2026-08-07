import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  title: string;
  price_azn: number;
  original_price_azn?: number;
  quantity: number;
  image_url: string;
  is_preorder?: boolean;
  preorder_lead_time?: string;
  variant_id?: string | null;
  sku?: string;
}

interface CartState {
  items: CartItem[];
  savedItems: CartItem[];
  appliedCoupon: string | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSavedItem: (id: string) => void;
  applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => void;
  removeCoupon: () => void;
  getTotalPrice: () => number;
  getOriginalTotalPrice: () => number;
  getProductSavings: () => number;
  getDiscountAmount: () => number;
  getFinalPrice: () => number;
  getTotalItems: () => number;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],
      appliedCoupon: null,
      discountType: null,
      discountValue: 0,
      
      addItem: (newItem: CartItem) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === newItem.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === newItem.id
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, discountType: null, discountValue: 0 });
      },

      saveForLater: (id: string) => {
        set((state) => {
          const itemToSave = state.items.find((item) => item.id === id);
          if (!itemToSave) return {};
          return {
            items: state.items.filter((item) => item.id !== id),
            savedItems: [...state.savedItems.filter((i) => i.id !== id), itemToSave],
          };
        });
      },

      moveToCart: (id: string) => {
        set((state) => {
          const itemToMove = state.savedItems.find((item) => item.id === id);
          if (!itemToMove) return {};
          return {
            savedItems: state.savedItems.filter((item) => item.id !== id),
            items: [...state.items.filter((i) => i.id !== id), itemToMove],
          };
        });
      },

      removeSavedItem: (id: string) => {
        set((state) => ({
          savedItems: state.savedItems.filter((item) => item.id !== id),
        }));
      },

      applyCoupon: (code: string, type: 'percentage' | 'fixed', value: number) => {
        set({ appliedCoupon: code, discountType: type, discountValue: value });
      },
      removeCoupon: () => {
        set({ appliedCoupon: null, discountType: null, discountValue: 0 });
      },

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price_azn * item.quantity, 0);
      },

      getOriginalTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const orig = item.original_price_azn && item.original_price_azn > item.price_azn ? item.original_price_azn : item.price_azn;
          return total + orig * item.quantity;
        }, 0);
      },

      getProductSavings: () => {
        const state = get();
        const origTotal = state.getOriginalTotalPrice();
        const subtotal = state.getTotalPrice();
        return Math.max(0, origTotal - subtotal);
      },

      getDiscountAmount: () => {
        const state = get();
        const subtotal = state.getTotalPrice();
        if (!state.appliedCoupon || !state.discountType) return 0;
        if (state.discountType === 'percentage') {
          return (subtotal * state.discountValue) / 100;
        }
        return state.discountValue;
      },
      getFinalPrice: () => {
        const state = get();
        const subtotal = state.getTotalPrice();
        const discount = state.getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'rubikshop-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (dummyStorage as any))),
    }
  )
);
