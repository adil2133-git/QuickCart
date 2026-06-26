// ── Backend-shaped types ───────────────────────────────────────────────────
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
  price: number; // cached price at time of add — display only, never trust for totals
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
}

export interface CheckoutSummaryResponse {
  success: boolean;
  cart: CartResponse;
  addresses: SavedAddress[];
  defaultAddressId: string | null;
  codAllowed: boolean;
  totals: OrderTotals | null;
}

export type PaymentMethod = "COD"; // "ONLINE" will be added when that's wired up

export interface PlaceOrderPayload {
  addressId: string;
  paymentMethod: PaymentMethod;
  deliveryInstructions?: string;
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