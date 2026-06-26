import { create } from "zustand";
import type { CustomerOrder, OrdersTab } from "../types/myOrders";

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
}));