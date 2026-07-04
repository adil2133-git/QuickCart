import { create } from "zustand";
import api from "../../../api/axios";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartProduct {
  _id: string;
  productName: string;
  images: string[];
  price: number;
  unit?: string;
  availabilityStatus: string;
  stockQuantity: number;
  storeId: {
    _id: string;
    storeName: string;
    logoUrl?: string;
  };
}

export interface CartItem {
  productId: CartProduct;
  quantity: number;
  price: number;
}

export interface CartData {
  _id?: string;
  products: CartItem[];
  totalAmount: number;
}

export interface StoreConflict {
  cartStoreName: string;
  newStoreName: string;
  pendingProductId: string;
  pendingQuantity: number;
}

interface CartStore {
  // ── State ──────────────────────────────────────────────────────────────────
  cart: CartData | null;
  items: CartItem[];
  isLoading: boolean;
  isUpdating: string | null; // productId currently being updated
  error: string | null;
  conflict: StoreConflict | null; // non-null = show conflict modal

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchCart: () => Promise<void>;
  addToCart: (productIdOrItem: string | { _id: string }, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Multi-store conflict resolution
  resolveConflict: (replace: boolean) => Promise<void>;
  dismissConflict: () => void;

  // Helpers
  getItemQuantity: (productId: string) => number;
  cartItemCount: () => number;
  clearError: () => void;
}

// ─── Route prefix (matches your api baseURL of http://localhost:3001/api) ─────
const CART = "/customer/cart";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  items: [],
  isLoading: false,
  isUpdating: null,
  error: null,
  conflict: null,

  // ── Fetch cart on mount ───────────────────────────────────────────────────
  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(CART);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isLoading: false });
    } catch (err: any) {
      // 401 is handled globally by your interceptor (redirect to /login)
      // Only surface non-auth errors here
      if (err.response?.status !== 401) {
        set({
          error: err.response?.data?.message ?? "Failed to load cart.",
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  // ── Add item ──────────────────────────────────────────────────────────────
  addToCart: async (productIdOrItem, quantity = 1) => {
    const resolvedProductId = typeof productIdOrItem === "string"
      ? productIdOrItem
      : productIdOrItem._id;
    set({ isUpdating: resolvedProductId, error: null });
    try {
      const { data } = await api.post(`${CART}/add`, { productId: resolvedProductId, quantity });
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
    } catch (err: any) {
      // 409 = multi-store conflict — handle in UI, not as a generic error
      if (err.response?.status === 409) {
        const d = err.response.data;
        set({
          conflict: {
            cartStoreName: d.cartStoreName,
            newStoreName: d.newStoreName,
            pendingProductId: d.productId,
            pendingQuantity: d.quantity,
          },
          isUpdating: null,
        });
        return;
      }
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message ?? "Failed to add item.");
      }
      set({ isUpdating: null });
    }
  },

  // ── Update quantity ───────────────────────────────────────────────────────
  updateQuantity: async (productId, quantity) => {
    set({ isUpdating: productId, error: null });
    try {
      const { data } = await api.patch(`${CART}/item/${productId}`, { quantity });
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message ?? "Failed to update quantity.");
      }
      set({ isUpdating: null });
    }
  },

  // ── Remove item ───────────────────────────────────────────────────────────
  removeItem: async (productId) => {
    set({ isUpdating: productId, error: null });
    try {
      const { data } = await api.delete(`${CART}/item/${productId}`);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message ?? "Failed to remove item.");
      }
      set({ isUpdating: null });
    }
  },

  // ── Clear entire cart ─────────────────────────────────────────────────────
  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.delete(CART);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isLoading: false });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message ?? "Failed to clear cart.");
      }
      set({ isLoading: false });
    }
  },

  // ── Multi-store conflict: user chose to replace or keep ───────────────────
  resolveConflict: async (replace) => {
    const { conflict } = get();
    if (!conflict) return;

    if (!replace) {
      set({ conflict: null });
      return;
    }

    set({ isLoading: true, error: null, conflict: null });
    try {
      await api.delete(CART);
      const { data } = await api.post(`${CART}/add`, {
        productId: conflict.pendingProductId,
        quantity: conflict.pendingQuantity,
      });
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isLoading: false });
    } catch (err: any) {
      if (err.response?.status !== 401) {
        set({
          error: err.response?.data?.message ?? "Failed to replace cart.",
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  dismissConflict: () => set({ conflict: null }),

  // ── Helpers ───────────────────────────────────────────────────────────────
  getItemQuantity: (productId) => {
    const { cart, items } = get();
    const source = items.length > 0 ? items : cart?.products ?? [];
    const item = source.find((p) => p.productId._id === productId);
    return item?.quantity ?? 0;
  },

  cartItemCount: () => {
    const { cart, items } = get();
    const source = items.length > 0 ? items : cart?.products ?? [];
    return source.reduce((sum, item) => sum + item.quantity, 0);
  },

  clearError: () => set({ error: null }),
}));