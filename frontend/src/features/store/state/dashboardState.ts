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
}));