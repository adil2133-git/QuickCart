export interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface CartItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  price: number;
  image: string;
}

export type PaymentMethod = "online" | "cod";

export interface OrderTotals {
  productTotal: number;
  deliveryCharge: number;
  packagingFee: number;
  couponDiscount: number;
  grandTotal: number;
}

export interface CheckoutState {
  selectedAddressId: string;
  deliveryInstructions: string;
  paymentMethod: PaymentMethod;
  couponCode: string;
  couponApplied: boolean;
}

export interface CheckoutActions {
  setSelectedAddressId: (id: string) => void;
  setDeliveryInstructions: (value: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCouponCode: (value: string) => void;
  applyCoupon: () => void;
}

export type CheckoutStore = CheckoutState & CheckoutActions;