import { create } from "zustand";
import type { CheckoutStore } from "../types/checkout";

export const PRODUCT_TOTAL = 630;
export const DELIVERY_CHARGE = 30;
export const PACKAGING_FEE = 15;
export const COUPON_DISCOUNT = 50;
export const GRAND_TOTAL = PRODUCT_TOTAL + DELIVERY_CHARGE + PACKAGING_FEE;

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  selectedAddressId: "home",
  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  deliveryInstructions: "",
  setDeliveryInstructions: (value) => set({ deliveryInstructions: value }),

  paymentMethod: "online",
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  couponCode: "",
  setCouponCode: (value) => set({ couponCode: value }),

  couponApplied: false,
  applyCoupon: () => {
    const { couponCode } = get();
    if (couponCode.trim()) set({ couponApplied: true });
  },
}));