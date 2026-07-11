// -- Backend-shaped types ---------------------------------------------------
// These mirror what GET /api/customer/checkout/summary actually returns,
// not the flat mock shapes the UI used before.

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SavedAddress {
  _id: string;
  label?: string;
  address: string;
  coordinates?: Coordinates;
}

export interface PopulatedProduct {
  _id: string;
  productName: string;
  images?: string[];
  price: number;
  unit?: string;
  availabilityStatus?: string;
  stockQuantity: number;
  storeId?: { _id: string; storeName: string; logoUrl?: string };
}

export interface CartProductLine {
  productId: PopulatedProduct;
  quantity: number;
  price: number; // cached price at time of add -- display only, never trust for totals
}

export interface CartResponse {
  _id?: string;
  products: CartProductLine[];
  totalAmount: number;
}

export interface OrderTotals {
  productTotal: number;
  deliveryCharge: number;
  packagingFee: number;
  grandTotal: number;
  distanceKm?: number;
  freeDeliveryApplied?: boolean;
}

export interface CheckoutSummaryResponse {
  success: boolean;
  cart: CartResponse;
  addresses: SavedAddress[];
  defaultAddressId: string | null;
  codAllowed: boolean;
  walletBalance: number;
  totals: OrderTotals | null;
  pricingError?: string | null;
  minOrderValue?: number;
}

export type PaymentMethod = "COD" | "ONLINE";

export interface PlaceOrderPayload {
  addressId: string;
  paymentMethod: "COD";
}

export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
  };
}

// -- Online payment ----------------------------------------------------------

export interface CreateRazorpayOrderPayload {
  addressId: string;
  useWallet?: boolean;
}

export interface CreateRazorpayOrderResponse {
  success: boolean;
  fullyCoveredByWallet: boolean;
  message?: string;
  order?: PlaceOrderResponse["order"]; // present when fullyCoveredByWallet is true
  razorpayOrder?: { id: string; amount: number; currency: string };
  razorpayKeyId?: string;
  totals?: OrderTotals;
  walletAmountUsed?: number;
  amountToPay?: number;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  addressId: string;
  useWallet?: boolean;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order: PlaceOrderResponse["order"];
}

// -- Wallet --------------------------------------------------------------------

export interface WalletTransaction {
  id: string;
  amount: number;
  type: "REFUND_CREDIT" | "ORDER_PAYMENT" | "ADMIN_ADJUSTMENT";
  description?: string;
  orderNumber?: string | null;
  createdAt: string;
}

export interface WalletResponse {
  success: boolean;
  balance: number;
  transactions: WalletTransaction[];
}