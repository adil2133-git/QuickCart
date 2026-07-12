import { useEffect } from "react";
import { toast } from "sonner";
import { suppressNextOrderToast } from "../../shared/state/notificationState";
import { useCheckoutStore, LOCAL_COUPON_DISCOUNT } from "../state/checkoutState";
import api from "../../../api/axios";
import { loadRazorpayScript } from "../../../lib/loadRazorpay";
import type {
  CartProductLine,
  CheckoutSummaryResponse,
  CreateRazorpayOrderResponse,
  PlaceOrderPayload,
  PlaceOrderResponse,
  SavedAddress,
  VerifyPaymentResponse,
} from "../types/checkout";

// -- Load summary on mount, and again whenever the selected address changes --
// Delivery charge is distance-based (store -> address), so totals can only be
// computed once an address is known -- every address change needs a fresh
// summary call.
export function useLoadCheckoutSummary() {
  const setSummaryLoading = useCheckoutStore((s) => s.setSummaryLoading);
  const setSummaryData = useCheckoutStore((s) => s.setSummaryData);
  const setSummaryError = useCheckoutStore((s) => s.setSummaryError);
  const isLoadingSummary = useCheckoutStore((s) => s.isLoadingSummary);
  const summaryError = useCheckoutStore((s) => s.summaryError);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setSummaryLoading();
      try {
        const { data } = await api.get<CheckoutSummaryResponse>("/customer/checkout/summary", {
          params: selectedAddressId ? { addressId: selectedAddressId } : undefined,
        });
        if (cancelled) return;
        setSummaryData({
          cart: data.cart,
          addresses: data.addresses,
          defaultAddressId: data.defaultAddressId,
          codAllowed: data.codAllowed,
          walletBalance: data.walletBalance,
          totals: data.totals,
          pricingError: data.pricingError,
          minOrderValue: data.minOrderValue,
        });
      } catch (err) {
        if (cancelled) return;
        // axios interceptor already handles 401/403 (toast + redirect/logout);
        // this covers everything else -- network errors, 500s, etc.
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
  }, [selectedAddressId]);

  return { isLoadingSummary, summaryError };
}

// Stable reference so the selector never returns a fresh array when cart is
// null -- returning a new [] literal each render breaks Zustand/React's
// reference-equality check and triggers "getSnapshot should be cached".
const EMPTY_CART_ITEMS: CartProductLine[] = [];

// -- Cart items, shaped for the existing OrderSummary UI --------------------
export function useCartItems(): CartProductLine[] {
  return useCheckoutStore((s) => s.cart?.products ?? EMPTY_CART_ITEMS);
}

export function useOrderTotals() {
  const productTotal = useCheckoutStore((s) => s.productTotal);
  const deliveryCharge = useCheckoutStore((s) => s.deliveryCharge);
  const packagingFee = useCheckoutStore((s) => s.packagingFee);
  const couponApplied = useCheckoutStore((s) => s.couponApplied);
  const distanceKm = useCheckoutStore((s) => s.distanceKm);
  const freeDeliveryApplied = useCheckoutStore((s) => s.freeDeliveryApplied);
  const pricingError = useCheckoutStore((s) => s.pricingError);
  const minOrderValue = useCheckoutStore((s) => s.minOrderValue);
  const walletBalance = useCheckoutStore((s) => s.walletBalance);
  const useWallet = useCheckoutStore((s) => s.useWallet);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);

  // The local coupon discount is cosmetic display only -- it is NOT sent to
  // the backend and the backend's own totals are what's actually charged.
  const couponDiscount = couponApplied ? LOCAL_COUPON_DISCOUNT : 0;
  const grandTotal = productTotal + deliveryCharge + packagingFee - couponDiscount;

  // How much wallet balance would actually be applied, and what's left to
  // pay via Razorpay -- purely for display; the backend recomputes this
  // exact split server-side before charging anything.
  const walletApplicable = paymentMethod === "ONLINE" && useWallet;
  const walletAmountToApply = walletApplicable ? Math.min(walletBalance, grandTotal) : 0;
  const amountToPay = grandTotal - walletAmountToApply;

  return {
    productTotal,
    deliveryCharge,
    packagingFee,
    couponDiscount,
    grandTotal,
    distanceKm,
    freeDeliveryApplied,
    pricingError,
    minOrderValue,
    walletBalance,
    walletAmountToApply,
    amountToPay,
  };
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
  const walletBalance = useCheckoutStore((s) => s.walletBalance);
  const useWallet = useCheckoutStore((s) => s.useWallet);
  const setUseWallet = useCheckoutStore((s) => s.setUseWallet);
  return { paymentMethod, setPaymentMethod, walletBalance, useWallet, setUseWallet };
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

// -- Place order --------------------------------------------------------------
export function usePlaceOrder() {
  const isPlacingOrder = useCheckoutStore((s) => s.isPlacingOrder);
  const setIsPlacingOrder = useCheckoutStore((s) => s.setIsPlacingOrder);
  const resetAfterOrder = useCheckoutStore((s) => s.resetAfterOrder);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const useWallet = useCheckoutStore((s) => s.useWallet);
  const cart = useCheckoutStore((s) => s.cart);
  const pricingError = useCheckoutStore((s) => s.pricingError);
  const productTotal = useCheckoutStore((s) => s.productTotal);
  const minOrderValue = useCheckoutStore((s) => s.minOrderValue);

  async function submitCOD(addressId: string) {
    const { data: result } = await api.post<PlaceOrderResponse>(
      "/customer/checkout/place-order",
      {
        addressId,
        paymentMethod: "COD",
      } satisfies PlaceOrderPayload
    );
    return result.order;
  }

  async function submitOnline(addressId: string) {
    const { data } = await api.post<CreateRazorpayOrderResponse>("/customer/payment/create-order", {
      addressId,
      useWallet,
    });

    // Wallet alone covered the whole order -- no Razorpay step needed at all.
    if (data.fullyCoveredByWallet && data.order) {
      return data.order;
    }

    if (!data.razorpayOrder || !data.razorpayKeyId) {
      throw new Error("Could not start payment. Please try again.");
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error("Couldn't load the payment gateway. Check your connection and try again.");
    }

    // The Razorpay modal is callback-driven, so we bridge it back into this
    // async function with a Promise that resolves/rejects from inside the
    // handler / ondismiss callbacks.
    return new Promise<PlaceOrderResponse["order"] | null>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: data.razorpayKeyId!,
        amount: data.razorpayOrder!.amount,
        currency: data.razorpayOrder!.currency,
        name: "QuickKart",
        description: "Order Payment",
        order_id: data.razorpayOrder!.id,
        handler: async (response) => {
          try {
            const { data: verifyResult } = await api.post<VerifyPaymentResponse>(
              "/customer/payment/verify-payment",
              {
                ...response,
                addressId,
                useWallet,
              }
            );
            resolve(verifyResult.order);
          } catch (err) {
            const message =
              (err as any)?.response?.data?.message ?? "Payment verification failed.";
            reject(new Error(message));
          }
        },
        modal: {
          ondismiss: () => resolve(null), // user closed the modal -- not an error, just no order
        },
        theme: { color: "#145C43" },
      });
      rzp.open();
    });
  }

  async function submit() {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return null;
    }
    if (!cart || cart.products.length === 0) {
      toast.error("Your cart is empty.");
      return null;
    }
    if (pricingError) {
      toast.error(pricingError, { id: "pricing-error" });
      return null;
    }
    if (productTotal < minOrderValue) {
      toast.error(`Minimum order value is ₹${minOrderValue}.`, { id: "min-order-error" });
      return null;
    }

    setIsPlacingOrder(true);
    try {
      const order =
        paymentMethod === "COD" ? await submitCOD(selectedAddressId) : await submitOnline(selectedAddressId);
      if (!order) return null; // e.g. Razorpay modal dismissed
      toast.success(`Order ${order.orderNumber} placed!`);
      suppressNextOrderToast(order._id);
      resetAfterOrder();
      return order;
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ??
        (err instanceof Error ? err.message : "Couldn't place your order. Please try again.");
      toast.error(message, { id: "place-order-error" });
      return null;
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return { submit, isPlacingOrder };
}