import { create } from "zustand";
import type {
  CartResponse,
  PaymentMethod,
  SavedAddress,
} from "../types/checkout";

// Local-only coupon placeholder — purely cosmetic until a real coupon system
// exists on the backend. Deliberately NOT folded into grandTotal sent to the
// server; the backend computes its own totals and ignores this entirely.
export const LOCAL_COUPON_DISCOUNT = 50;

interface CheckoutState {
  // ── Server state ──────────────────────────────────────────────────────────
  cart: CartResponse | null;
  addresses: SavedAddress[];
  codAllowed: boolean;
  productTotal: number;
  deliveryCharge: number;
  packagingFee: number;

  isLoadingSummary: boolean;
  summaryError: string | null;

  // ── UI-only draft state ───────────────────────────────────────────────────
  selectedAddressId: string | null;
  deliveryInstructions: string;
  paymentMethod: PaymentMethod;
  couponCode: string;
  couponApplied: boolean;

  // ── Order submission state ────────────────────────────────────────────────
  isPlacingOrder: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setSummaryLoading: () => void;
  setSummaryData: (data: {
    cart: CartResponse;
    addresses: SavedAddress[];
    defaultAddressId: string | null;
    codAllowed: boolean;
    totals: { productTotal: number; deliveryCharge: number; packagingFee: number } | null;
  }) => void;
  setSummaryError: (message: string) => void;

  setSelectedAddressId: (id: string) => void;
  setDeliveryInstructions: (value: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCouponCode: (value: string) => void;
  applyCoupon: () => void;

  setIsPlacingOrder: (value: boolean) => void;
  resetAfterOrder: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  cart: null,
  addresses: [],
  codAllowed: true,
  productTotal: 0,
  deliveryCharge: 0,
  packagingFee: 0,

  isLoadingSummary: false,
  summaryError: null,

  selectedAddressId: null,
  deliveryInstructions: "",
  paymentMethod: "COD",
  couponCode: "",
  couponApplied: false,

  isPlacingOrder: false,

  setSummaryLoading: () => set({ isLoadingSummary: true, summaryError: null }),

  setSummaryData: ({ cart, addresses, defaultAddressId, codAllowed, totals }) => {
    const currentSelected = get().selectedAddressId;
    // Keep the user's selection if it's still valid, otherwise fall back to
    // the server's default, otherwise the first saved address.
    const stillValid = currentSelected && addresses.some((a) => a._id === currentSelected);
    const nextSelected = stillValid
      ? currentSelected
      : defaultAddressId ?? addresses[0]?._id ?? null;

    set({
      cart,
      addresses,
      codAllowed,
      productTotal: totals?.productTotal ?? 0,
      deliveryCharge: totals?.deliveryCharge ?? 0,
      packagingFee: totals?.packagingFee ?? 0,
      selectedAddressId: nextSelected,
      isLoadingSummary: false,
      summaryError: null,
    });
  },

  setSummaryError: (message) => set({ isLoadingSummary: false, summaryError: message }),

  setSelectedAddressId: (id) => set({ selectedAddressId: id }),
  setDeliveryInstructions: (value) => set({ deliveryInstructions: value }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCouponCode: (value) => set({ couponCode: value }),

  applyCoupon: () => {
    const { couponCode } = get();
    if (couponCode.trim()) set({ couponApplied: true });
  },

  setIsPlacingOrder: (value) => set({ isPlacingOrder: value }),

  resetAfterOrder: () =>
    set({
      cart: { products: [], totalAmount: 0 },
      deliveryInstructions: "",
      couponCode: "",
      couponApplied: false,
    }),
}));