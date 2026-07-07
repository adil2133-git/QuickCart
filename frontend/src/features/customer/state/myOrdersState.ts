import { create } from "zustand";
import type { CustomerOrder, OrdersTab, RawOrderStatus } from "../types/myOrders";

// Maps raw backend status → collapsed UI status + progress
function deriveFromRaw(raw: RawOrderStatus): Pick<CustomerOrder, "status" | "progressPercent"> {
  const statusMap: Record<RawOrderStatus, CustomerOrder["status"]> = {
    PENDING: "PROCESSING",
    ACCEPTED: "PROCESSING",
    PACKING: "PROCESSING",
    READY_FOR_PICKUP: "PACKED",
    DRIVER_ASSIGNED: "PACKED",
    PICKED_UP: "PACKED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
  };
  const progressMap: Record<RawOrderStatus, number> = {
    PENDING: 10, ACCEPTED: 25, PACKING: 40,
    READY_FOR_PICKUP: 55, DRIVER_ASSIGNED: 65, PICKED_UP: 75,
    OUT_FOR_DELIVERY: 90, DELIVERED: 100, CANCELLED: 0,
  };
  return { status: statusMap[raw], progressPercent: progressMap[raw] };
}

interface OrdersState {
  activeTab: OrdersTab;
  setActiveTab: (tab: OrdersTab) => void;

  // ── Server state ──────────────────────────────────────────────────────────
  orders: CustomerOrder[];
  isLoading: boolean;
  error: string | null;

  setLoading: () => void;
  setOrders: (orders: CustomerOrder[]) => void;
  setError: (message: string) => void;
  liveUpdateStatus: (orderId: string, rawStatus: RawOrderStatus) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  activeTab: "active",
  setActiveTab: (tab) => set({ activeTab: tab }),

  orders: [],
  isLoading: false,
  error: null,

  setLoading: () => set({ isLoading: true, error: null }),
  setOrders: (orders) => set({ orders, isLoading: false, error: null }),
  setError: (message) => set({ isLoading: false, error: message }),
  liveUpdateStatus: (orderId, rawStatus) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId ? { ...o, rawStatus, ...deriveFromRaw(rawStatus) } : o
      ),
    })),
}));