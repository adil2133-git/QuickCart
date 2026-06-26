import { useCheckoutStore, PRODUCT_TOTAL, DELIVERY_CHARGE, PACKAGING_FEE, COUPON_DISCOUNT, GRAND_TOTAL } from "../state/checkoutState";
import type { Address, CartItem, OrderTotals } from "../types/checkout";

// ── Static Data ───────────────────────────────────────────────────────────────

export const addresses: Address[] = [
  { id: "home",     label: "Home",       name: "Jane Doe", line1: "123 Sunnyside Lane",       city: "Greenfield",    state: "CA", zip: "93927", phone: "+1 555-0123" },
  { id: "work",     label: "Work",       name: "Jane Doe", line1: "456 Tech Park, Office 302", city: "Palo Alto",     state: "CA", zip: "94301", phone: "+1 555-0987" },
  { id: "grandmas", label: "Grandma's",  name: "Jane Doe", line1: "789 Rosewood Terrace",      city: "Carmel",        state: "CA", zip: "93923", phone: "+1 555-4567" },
  { id: "office",   label: "Office",     name: "Jane Doe", line1: "100 Innovation Way",        city: "San Francisco", state: "CA", zip: "94105", phone: "+1 555-1111" },
  { id: "gym",      label: "Gym",        name: "Jane Doe", line1: "50 Iron Gate Blvd",         city: "Pacific Grove", state: "CA", zip: "93950", phone: "+1 555-2222" },
  { id: "studio",   label: "Studio",     name: "Jane Doe", line1: "22 Artisan Alley",          city: "Monterey",      state: "CA", zip: "93940", phone: "+1 555-3333" },
];

export const cartItems: CartItem[] = [
  { id: "1", name: "Wildflower Honey Jar", description: "500g · Qty: 1", qty: 1, price: 450, image: "🍯" },
  { id: "2", name: "Sourdough Loaf",       description: "Large · Qty: 1", qty: 1, price: 180, image: "🍞" },
];

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useSelectedAddress(): Address {
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  return addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
}

export function useOrderTotals(): OrderTotals {
  const couponApplied = useCheckoutStore((s) => s.couponApplied);
  const discount = couponApplied ? COUPON_DISCOUNT : 0;
  return {
    productTotal: PRODUCT_TOTAL,
    deliveryCharge: DELIVERY_CHARGE,
    packagingFee: PACKAGING_FEE,
    couponDiscount: discount,
    grandTotal: GRAND_TOTAL - discount,
  };
}

export function useCoupon() {
  const couponCode     = useCheckoutStore((s) => s.couponCode);
  const setCouponCode  = useCheckoutStore((s) => s.setCouponCode);
  const couponApplied  = useCheckoutStore((s) => s.couponApplied);
  const applyCoupon    = useCheckoutStore((s) => s.applyCoupon);
  return { couponCode, setCouponCode, couponApplied, applyCoupon };
}

export function usePayment() {
  const paymentMethod    = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  return { paymentMethod, setPaymentMethod };
}

export function useDeliveryInstructions() {
  const deliveryInstructions    = useCheckoutStore((s) => s.deliveryInstructions);
  const setDeliveryInstructions = useCheckoutStore((s) => s.setDeliveryInstructions);
  return { deliveryInstructions, setDeliveryInstructions };
}

export function useAddressDropdown() {
  const selectedAddressId    = useCheckoutStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useCheckoutStore((s) => s.setSelectedAddressId);
  const selected             = useSelectedAddress();
  return { selectedAddressId, setSelectedAddressId, selected };
}