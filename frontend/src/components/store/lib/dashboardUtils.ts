import type { OrderStatus, StoreStatus, AvailabilityStatus } from "../../../features/store/types/dashboard";
// ---------------------------------------------------------------------------
// Order status -> display config
// Statuses are grouped so "Pending Orders" on the dashboard has one
// authoritative definition instead of being re-derived in multiple places.
// ---------------------------------------------------------------------------

export const PENDING_ORDER_STATUSES: OrderStatus[] = ["PENDING", "ACCEPTED", "PACKING"];

export function isPendingOrder(status: OrderStatus): boolean {
  return PENDING_ORDER_STATUSES.includes(status);
}

interface StatusBadgeConfig {
  label: string;
  className: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusBadgeConfig> = {
  PENDING: { label: "New", className: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Accepted", className: "bg-amber-100 text-amber-700" },
  PACKING: { label: "Preparing", className: "bg-emerald-100 text-emerald-700" },
  READY_FOR_PICKUP: { label: "Ready", className: "bg-sky-100 text-sky-700" },
  DRIVER_ASSIGNED: { label: "Driver assigned", className: "bg-sky-100 text-sky-700" },
  PICKED_UP: { label: "Picked up", className: "bg-violet-100 text-violet-700" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", className: "bg-violet-100 text-violet-700" },
  DELIVERED: { label: "Delivered", className: "bg-stone-200 text-stone-600" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function getOrderStatusBadge(status: OrderStatus): StatusBadgeConfig {
  return ORDER_STATUS_CONFIG[status];
}

// ---------------------------------------------------------------------------
// Store status (storeProfile.storeStatus: OPEN | CLOSED | BUSY)
// ---------------------------------------------------------------------------

export const STORE_STATUS_CONFIG: Record<
  StoreStatus,
  { label: string; dotClassName: string; trackClassName: string }
> = {
  OPEN: { label: "Open", dotClassName: "bg-emerald-500", trackClassName: "bg-emerald-500" },
  BUSY: { label: "Busy", dotClassName: "bg-amber-500", trackClassName: "bg-amber-500" },
  CLOSED: { label: "Closed", dotClassName: "bg-stone-400", trackClassName: "bg-stone-300" },
};

// ---------------------------------------------------------------------------
// Product availability / low stock
// NOTE: there's no `lowStockThreshold` field on Product yet. Using a fixed
// constant for now — swap for a per-product or per-store config field later.
// ---------------------------------------------------------------------------

export const LOW_STOCK_THRESHOLD = 10;

export function isLowStock(stockQuantity: number, availabilityStatus: AvailabilityStatus): boolean {
  return availabilityStatus === "AVAILABLE" && stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Stable, deterministic pastel avatar background derived from the name,
// so the same customer always gets the same color without storing one.
const AVATAR_PALETTE = [
  "bg-orange-200 text-orange-800",
  "bg-rose-200 text-rose-800",
  "bg-sky-200 text-sky-800",
  "bg-emerald-200 text-emerald-800",
  "bg-violet-200 text-violet-800",
  "bg-amber-200 text-amber-800",
];

export function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
