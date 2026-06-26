import { useEffect } from "react";
import { toast } from "sonner";
import { useCheckoutStore, LOCAL_COUPON_DISCOUNT } from "../state/checkoutState";
import api from "../../../api/axios"; // adjust to your real path
import type {
  CartProductLine,
  CheckoutSummaryResponse,
  PlaceOrderPayload,
  PlaceOrderResponse,
  SavedAddress,
} from "../types/checkout";

// ── Load summary on mount ──────────────────────────────────────────────────
// Call this once near the top of CheckoutPage. Every other hook below just
// reads from the store, so only one network call happens per page visit.
export function useLoadCheckoutSummary() {
  const setSummaryLoading = useCheckoutStore((s) => s.setSummaryLoading);
  const setSummaryData = useCheckoutStore((s) => s.setSummaryData);
  const setSummaryError = useCheckoutStore((s) => s.setSummaryError);
  const isLoadingSummary = useCheckoutStore((s) => s.isLoadingSummary);
  const summaryError = useCheckoutStore((s) => s.summaryError);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setSummaryLoading();
      try {
        const { data } = await api.get<CheckoutSummaryResponse>("/customer/checkout/summary");
        if (cancelled) return;
        setSummaryData({
          cart: data.cart,
          addresses: data.addresses,
          defaultAddressId: data.defaultAddressId,
          codAllowed: data.codAllowed,
          totals: data.totals,
        });
      } catch (err) {
        if (cancelled) return;
        // axios interceptor already handles 401/403 (toast + redirect/logout);
        // this covers everything else — network errors, 500s, etc.
        const message =
          (err as any)?.response?.data?.message ?? "Couldn't load your checkout. Please try again.";
        setSummaryError(message);
        toast.error(message, { id: "checkout-summary-error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoadingSummary, summaryError };
}

// Stable reference so the selector never returns a fresh array when cart is
// null — returning a new [] literal each render breaks Zustand/React's
// reference-equality check and triggers "getSnapshot should be cached".
const EMPTY_CART_ITEMS: CartProductLine[] = [];

// ── Cart items, shaped for the existing OrderSummary UI ───────────────────
export function useCartItems(): CartProductLine[] {
  return useCheckoutStore((s) => s.cart?.products ?? EMPTY_CART_ITEMS);
}

export function useOrderTotals() {
  const productTotal = useCheckoutStore((s) => s.productTotal);
  const deliveryCharge = useCheckoutStore((s) => s.deliveryCharge);
  const packagingFee = useCheckoutStore((s) => s.packagingFee);
  const couponApplied = useCheckoutStore((s) => s.couponApplied);

  // The local coupon discount is cosmetic display only — it is NOT sent to
  // the backend and the backend's own totals are what's actually charged.
  const couponDiscount = couponApplied ? LOCAL_COUPON_DISCOUNT : 0;
  const grandTotal = productTotal + deliveryCharge + packagingFee - couponDiscount;

  return { productTotal, deliveryCharge, packagingFee, couponDiscount, grandTotal };
}

export function useCoupon() {
  const couponCode = useCheckoutStore((s) => s.couponCode);
  const setCouponCode = useCheckoutStore((s) => s.setCouponCode);
  const couponApplied = useCheckoutStore((s) => s.couponApplied);
  const applyCoupon = useCheckoutStore((s) => s.applyCoupon);
  return { couponCode, setCouponCode, couponApplied, applyCoupon };
}

export function usePayment() {
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);
  return { paymentMethod, setPaymentMethod };
}

export function useDeliveryInstructions() {
  const deliveryInstructions = useCheckoutStore((s) => s.deliveryInstructions);
  const setDeliveryInstructions = useCheckoutStore((s) => s.setDeliveryInstructions);
  return { deliveryInstructions, setDeliveryInstructions };
}

export function useSelectedAddress(): SavedAddress | null {
  const addresses = useCheckoutStore((s) => s.addresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  return addresses.find((a) => a._id === selectedAddressId) ?? addresses[0] ?? null;
}

export function useAddressDropdown() {
  const addresses = useCheckoutStore((s) => s.addresses);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useCheckoutStore((s) => s.setSelectedAddressId);
  const selected = useSelectedAddress();
  return { addresses, selectedAddressId, setSelectedAddressId, selected };
}

// ── Place order ─────────────────────────────────────────────────────────────
export function usePlaceOrder() {
  const isPlacingOrder = useCheckoutStore((s) => s.isPlacingOrder);
  const setIsPlacingOrder = useCheckoutStore((s) => s.setIsPlacingOrder);
  const resetAfterOrder = useCheckoutStore((s) => s.resetAfterOrder);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const deliveryInstructions = useCheckoutStore((s) => s.deliveryInstructions);
  const cart = useCheckoutStore((s) => s.cart);

  async function submit() {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (!cart || cart.products.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const { data: result } = await api.post<PlaceOrderResponse>(
        "/customer/checkout/place-order",
        {
          addressId: selectedAddressId,
          paymentMethod,
          deliveryInstructions: deliveryInstructions.trim() || undefined,
        } satisfies PlaceOrderPayload
      );
      toast.success(`Order ${result.order.orderNumber} placed!`);
      resetAfterOrder();
      return result.order;
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ?? "Couldn't place your order. Please try again.";
      toast.error(message, { id: "place-order-error" });
      return null;
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return { submit, isPlacingOrder };
}