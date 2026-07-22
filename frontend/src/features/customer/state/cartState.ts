import { create } from "zustand";
import api from "../../../api/axios";
import { toast } from "sonner";
import { getApiErrorMessage, getApiErrorData, getApiErrorStatus } from "../../../api/apiError";

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
  cart: CartData | null;
  items: CartItem[];
  isLoading: boolean;
  isUpdating: string | null; // productId currently being updated
  error: string | null;
  conflict: StoreConflict | null; // non-null = show conflict modal

  fetchCart: () => Promise<void>;
  addToCart: (productIdOrItem: string | { _id: string }, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // multi-store conflict resolution
  resolveConflict: (replace: boolean) => Promise<void>;
  dismissConflict: () => void;

  getItemQuantity: (productId: string) => number;
  cartItemCount: () => number;
  clearError: () => void;
}

const CART = "/customer/cart";

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  items: [],
  isLoading: false,
  isUpdating: null,
  error: null,
  conflict: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(CART);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isLoading: false });
    } catch (err: unknown) {
      // 401 is handled globally by the axios interceptor (redirect to /login) — only surface other errors here
      if (getApiErrorStatus(err) !== 401) {
        set({
          error: getApiErrorMessage(err, "Failed to load cart."),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  addToCart: async (productIdOrItem, quantity = 1) => {
    const resolvedProductId = typeof productIdOrItem === "string"
      ? productIdOrItem
      : productIdOrItem._id;

    // already in the cart — bump the quantity instead of adding a duplicate row,
    // and skip the store-conflict check entirely since nothing new is being added
    const existingQty = get().getItemQuantity(resolvedProductId);
    if (existingQty > 0) {
      await get().updateQuantity(resolvedProductId, existingQty + quantity);
      toast.success("Added to cart", { duration: 2000 });
      return;
    }

    set({ isUpdating: resolvedProductId, error: null });
    try {
      const { data } = await api.post(`${CART}/add`, { productId: resolvedProductId, quantity });
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
      toast.success("Added to cart", { duration: 2000 });
    } catch (err: unknown) {
      // 409 = adding this would mix items from two stores — handled by the conflict modal, not a toast
      if (getApiErrorStatus(err) === 409) {
        const d = getApiErrorData(err) as { cartStoreName?: string; newStoreName?: string; productId?: string; quantity?: number } | undefined;
        set({
          conflict: {
            cartStoreName: d?.cartStoreName ?? "",
            newStoreName: d?.newStoreName ?? "",
            pendingProductId: d?.productId ?? "",
            pendingQuantity: d?.quantity ?? 0,
          },
          isUpdating: null,
        });
        return;
      }
      if (getApiErrorStatus(err) !== 401) {
        toast.error(getApiErrorMessage(err, "Failed to add item."));
      }
      set({ isUpdating: null });
    }
  },

  updateQuantity: async (productId, quantity) => {
    set({ isUpdating: productId, error: null });
    try {
      const { data } = await api.patch(`${CART}/item/${productId}`, { quantity });
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
    } catch (err: unknown) {
      if (getApiErrorStatus(err) !== 401) {
        toast.error(getApiErrorMessage(err, "Failed to update quantity."));
      }
      set({ isUpdating: null });
    }
  },

  removeItem: async (productId) => {
    set({ isUpdating: productId, error: null });
    try {
      const { data } = await api.delete(`${CART}/item/${productId}`);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isUpdating: null });
    } catch (err: unknown) {
      if (getApiErrorStatus(err) !== 401) {
        toast.error(getApiErrorMessage(err, "Failed to remove item."));
      }
      set({ isUpdating: null });
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.delete(CART);
      const normalizedCart = data.cart ?? { products: [], totalAmount: 0 };
      set({ cart: normalizedCart, items: normalizedCart.products ?? [], isLoading: false });
    } catch (err: unknown) {
      if (getApiErrorStatus(err) !== 401) {
        toast.error(getApiErrorMessage(err, "Failed to clear cart."));
      }
      set({ isLoading: false });
    }
  },

  // user chose to replace the existing cart with the item that caused the conflict
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
      toast.success("Cart updated", { duration: 2000 });
    } catch (err: unknown) {
      if (getApiErrorStatus(err) !== 401) {
        set({
          error: getApiErrorMessage(err, "Failed to replace cart."),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  dismissConflict: () => set({ conflict: null }),

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