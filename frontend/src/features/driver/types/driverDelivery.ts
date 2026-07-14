// ─── Enums ────────────────────────────────────────────────────────────────────

export type DeliveryRequestStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REJECTED";

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

export type DriverAvailabilityStatus = "ONLINE" | "OFFLINE" | "BUSY";

export type DeliveryStage =
  | "NAVIGATE_TO_STORE"
  | "REACHED_STORE"
  | "PICKED_UP"
  | "NAVIGATE_TO_CUSTOMER"
  | "REACHED_CUSTOMER"
  | "DELIVERED";

// ─── Request (New Requests tab) ───────────────────────────────────────────────

export interface DeliveryRequest {
  requestId: string;
  orderId: string;
  orderNumber: string;
  storeName: string;
  storeAddress: string;
  deliveryAddress: string;
  recipientName: string;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  estimatedEarnings: number;
  expiresInSeconds: number; // remaining seconds AT THE TIME this snapshot was taken — do not count down from this directly, it goes stale. Use `expiresAt` instead.
  expiresAt: number; // absolute deadline (epoch ms) — always compute live countdowns from this
  createdAt: string;
}

// ─── Active Delivery ──────────────────────────────────────────────────────────

export interface ActiveDeliveryStore {
  name: string;
  address: string;
  logoUrl?: string | null;
  phone?: string | null;
}

export interface ActiveDeliveryCustomer {
  name: string;
  address: string;
  phone?: string | null;
  deliveryInstruction?: string | null;
}

export interface ActiveDeliveryProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface DeliveryProgressStep {
  key: DeliveryStage;
  label: string;
  completedAt?: string | null; // ISO string when done
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
}

export interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  isPriority: boolean;
  store: ActiveDeliveryStore;
  customer: ActiveDeliveryCustomer;
  products: ActiveDeliveryProduct[];
  itemCount: number;
  paymentMethod: "COD" | "ONLINE";
  amountToCollect: number; // 0 if ONLINE
  orderStatus: OrderStatus;
  currentStage: DeliveryStage;
  progressSteps: DeliveryProgressStep[];
  cashCollected: boolean;
}

// ─── Completed History ────────────────────────────────────────────────────────

export interface CompletedDelivery {
  orderId: string;
  orderNumber: string;
  storeName: string;
  storeLogoUrl?: string | null;
  customerName: string;
  itemCount: number;
  completedAt: string; // ISO string
  earnings: number;
}

export interface CompletedHistoryPage {
  deliveries: CompletedDelivery[];
  total: number;
  page: number;
  pages: number;
}

// ─── Driver Stats (for dashboard summary cards) ───────────────────────────────

export interface DriverTodayStats {
  todayEarnings: number;
  earningsChangePercent: number; // vs yesterday, e.g. 12 means +12%
  completedCount: number;
  dailyTarget: number;
  currentCount: number; // deliveries done today
  targetBonus: number;  // bonus amount on hitting target
}

// ─── Stage → action button config ────────────────────────────────────────────

export interface StageAction {
  primaryLabel: string;
  secondaryLabel?: string;
  primaryVariant: "dark" | "green" | "outline";
  secondaryVariant?: "outline" | "muted";
  nextStage?: DeliveryStage;
  requiresCashConfirm?: boolean;
}