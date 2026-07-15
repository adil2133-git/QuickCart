import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "../types/product";

// NOTE: not used anywhere in the app — every page imports useCartStore from
// ../state/cartState (the real, server-backed cart) instead. Left in place
// rather than deleted without being asked, but safe to remove.
interface CartState {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product._id === product._id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product._id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product._id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (productId) => {
        const item = get().items.find((i) => i.product._id === productId);
        return item?.quantity ?? 0;
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
    }),
    { name: "quickkart-cart" }
  )
);

// wishlist is local-only (persisted to localStorage) — there's no backend
// wishlist endpoint yet, so this doesn't sync across devices
interface WishlistState {
  wishlist: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],

      toggleWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        }));
      },

      isWishlisted: (productId) => get().wishlist.includes(productId),
    }),
    { name: "quickkart-wishlist" }
  )
);

interface ProductDetailState {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  selectedImageIndex: number;
  quantity: number;

  setProduct: (product: Product) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedImageIndex: (index: number) => void;
  setQuantity: (quantity: number) => void;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  reset: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  product: null,
  isLoading: false,
  error: null,
  selectedImageIndex: 0,
  quantity: 1,

  setProduct: (product) => set({ product }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedImageIndex: (selectedImageIndex) => set({ selectedImageIndex }),
  setQuantity: (quantity) => set({ quantity }),
  incrementQuantity: () =>
    set((state) => ({ quantity: state.quantity + 1 })),
  decrementQuantity: () =>
    set((state) => ({ quantity: Math.max(1, state.quantity - 1) })),
  reset: () =>
    set({
      product: null,
      isLoading: false,
      error: null,
      selectedImageIndex: 0,
      quantity: 1,
    }),
}));