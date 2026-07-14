// ── Types for the "My Orders" page ─────────────────────────────────────────
// Mirrors what GET /api/customer/orders and GET /api/customer/orders/:id
// actually return from ordersController.js.

export type OrderStatus =
  | "PROCESSING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

// The real backend orderStatus enum (9 states) — kept here only for typing
// the rawStatus field; the UI itself works off the collapsed OrderStatus.
export type RawOrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PACKING"
  | "READY_FOR_PICKUP"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type OrderStage = "PROCESSING" | "PACKED" | "DELIVERY";

export interface OrderItemPreview {
  id: string;
  name: string;
  image: string | null; // null when the product has no images
}

export interface CustomerOrder {
  id: string;
  orderNumber: string; // e.g. "QK-99281"
  placedAt: string; // ISO date string (order's createdAt)
  storeName: string;
  status: OrderStatus;
  rawStatus: RawOrderStatus;
  // True once dispatch has given up finding a driver — only meaningful
  // while rawStatus is READY_FOR_PICKUP.
  driverSearchFailed: boolean;
  itemSummary: string; // e.g. "Fresh Produce & Dairy"
  itemCount: number;
  previewItems: OrderItemPreview[]; // thumbnails shown on the card
  progressPercent: number; // 0-100
  totalAmount: number;
}

// Extra fields present only on GET /api/customer/orders/:id
export interface CustomerOrderDetail extends CustomerOrder {
  products: { productId: string; productName: string; quantity: number; price: number }[];
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  paymentMethod: "ONLINE" | "COD";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: number;
  deliveryCharge: number;
  driver: { name: string; phone: string } | null;
  store: { name: string; logoUrl: string | null; address: string } | null;
}

export interface GetOrdersResponse {
  success: boolean;
  orders: CustomerOrder[];
}

export interface GetOrderDetailResponse {
  success: boolean;
  order: CustomerOrderDetail;
}

export type OrdersTab = "active" | "past";

// Maps a raw status to which of the three stages should render as "reached"
// on the progress tracker. Delivered/Cancelled orders only show in Past.
export const STAGE_ORDER: OrderStage[] = ["PROCESSING", "PACKED", "DELIVERY"];

export function stageIndexForStatus(status: OrderStatus): number {
  switch (status) {
    case "PROCESSING":
      return 0;
    case "PACKED":
      return 1;
    case "OUT_FOR_DELIVERY":
    case "DELIVERED":
      return 2;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}