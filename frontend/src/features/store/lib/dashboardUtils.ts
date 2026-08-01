import type { OrderStatus, StoreStatus, AvailabilityStatus } from "../types/dashboard";

export const PENDING_ORDER_STATUSES: OrderStatus[] = ["PENDING", "ACCEPTED", "PACKING"];

export function isPendingOrder(status: OrderStatus): boolean {
  return PENDING_ORDER_STATUSES.includes(status);
}

interface StatusBadgeConfig {
  label: string;
  className: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusBadgeConfig> = {
  PENDING: { label: "New", className: "bg-[#FEF3C7] text-[#B47800]" },
  ACCEPTED: { label: "Accepted", className: "bg-[#FEF3C7] text-[#B47800]" },
  PACKING: { label: "Preparing", className: "bg-[#E8EFEC] text-[#145C43]" },
  READY_FOR_PICKUP: { label: "Ready", className: "bg-[#E8EFEC] text-[#145C43]" },
  DRIVER_ASSIGNED: { label: "Driver assigned", className: "bg-[#E8EFEC] text-[#145C43]" },
  PICKED_UP: { label: "Picked up", className: "bg-[#E8EFEC] text-[#145C43]" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", className: "bg-[#E8EFEC] text-[#145C43]" },
  DELIVERED: { label: "Delivered", className: "bg-[#E8EFEC] text-[#145C43]" },
  CANCELLED: { label: "Cancelled", className: "bg-[#FBEAEA] text-[#BA1A1A]" },
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
  OPEN: { label: "Open", dotClassName: "bg-[#145C43]", trackClassName: "bg-[#145C43]" },
  BUSY: { label: "Busy", dotClassName: "bg-[#B47800]", trackClassName: "bg-[#B47800]" },
  CLOSED: { label: "Closed", dotClassName: "bg-[#BA1A1A]", trackClassName: "bg-[#BA1A1A]" },
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
    currency: "INR",
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
