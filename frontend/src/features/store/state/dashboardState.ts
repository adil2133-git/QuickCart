import { create } from "zustand";
import type { DashboardSummary, Order, StoreStatus } from "../types/dashboard";

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  setLoading: () => void;
  setSummary: (summary: DashboardSummary) => void;
  setError: (message: string) => void;
  setStatus: (status: StoreStatus) => void;
  addIncomingOrder: (order: Order) => void;
  applyOrderStatusChange: (orderId: string, orderStatus: Order["orderStatus"]) => void;
}


export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  setLoading: () => set({ isLoading: true, error: null }),
  setSummary: (summary) => set({ summary, isLoading: false, error: null }),
  setError: (message) => set({ error: message, isLoading: false }),
  setStatus: (status) =>
    set((s) => (s.summary ? { summary: { ...s.summary, status } } : s)),

  addIncomingOrder: (order) =>
    set((s) => {
      if (!s.summary) return s;
      return {
        summary: {
          ...s.summary,
          incomingOrders: [order, ...s.summary.incomingOrders].slice(0, 8),
          stats: {
            ...s.summary.stats,
            todaysOrders: s.summary.stats.todaysOrders + 1,
            todaysRevenue: s.summary.stats.todaysRevenue + order.totalAmount,
            pendingOrdersCount: s.summary.stats.pendingOrdersCount + 1,
          },
        },
      };
    }),

  // Mirrors the backend's rule: cancelled orders don't count toward
  // revenue. Only known-locally orders can be reconciled this way (the
  // incoming-orders list is capped to 8) — anything older falls back to
  // being correct again on the next full page load.
  applyOrderStatusChange: (orderId, orderStatus) =>
    set((s) => {
      if (!s.summary) return s;

      const existing = s.summary.incomingOrders.find((o) => o._id === orderId);
      const updatedOrders = s.summary.incomingOrders.map((o) =>
        o._id === orderId ? { ...o, orderStatus } : o
      );

      const wasAlreadyCancelled = existing?.orderStatus === "CANCELLED";
      const justCancelled = orderStatus === "CANCELLED" && existing && !wasAlreadyCancelled;

      if (!justCancelled) {
        return { summary: { ...s.summary, incomingOrders: updatedOrders } };
      }

      return {
        summary: {
          ...s.summary,
          incomingOrders: updatedOrders,
          stats: {
            ...s.summary.stats,
            todaysRevenue: Math.max(0, s.summary.stats.todaysRevenue - existing.totalAmount),
            pendingOrdersCount: Math.max(0, s.summary.stats.pendingOrdersCount - 1),
          },
        },
      };
    }),
}));