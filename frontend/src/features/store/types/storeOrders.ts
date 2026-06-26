// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PACKING"
  | "READY_FOR_PICKUP"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "ONLINE" | "COD";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type OrderFilterTab = "ALL" | "PENDING" | "ACCEPTED" | "READY";

// ─── NEW: Pagination shape returned by the backend ───────────────────────────
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Order list item (returned from GET /api/store/orders) ───────────────────

export interface StoreOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string | null;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  placedAt: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  products: StoreOrderItem[];
}

// ─── Order detail (returned from GET /api/store/orders/:id) ──────────────────

export interface StoreOrderDetail extends StoreOrder {
  store?: {
    name: string;
    logoUrl?: string;
    address?: string;
  } | null;
  driver?: {
    name: string;
    phone: string;
  } | null;
}

// ─── Packing checklist item ───────────────────────────────────────────────────

export interface PackingItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  image?: string | null;
  isPacked: boolean;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface GetStoreOrdersResponse {
  success: boolean;
  orders: StoreOrder[];
  pagination: Pagination; // NEW: backend now always returns this
}

export interface GetStoreOrderDetailResponse {
  success: boolean;
  order: StoreOrderDetail;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order?: Partial<StoreOrder>;
}