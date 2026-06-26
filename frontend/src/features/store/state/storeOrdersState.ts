import { create } from "zustand";
import type {
  StoreOrder,
  StoreOrderDetail,
  PackingItem,
  OrderFilterTab,
  Pagination, // NEW import
} from "../types/storeOrders";

interface StoreOrdersState {
  // ── Filter tab ──────────────────────────────────────────────────────────────
  activeTab: OrderFilterTab;
  setActiveTab: (tab: OrderFilterTab) => void;

  // ── Orders list ─────────────────────────────────────────────────────────────
  orders: StoreOrder[];
  isLoadingOrders: boolean;
  ordersError: string | null;
  setLoadingOrders: () => void;
  setOrders: (orders: StoreOrder[]) => void;
  setOrdersError: (message: string) => void;

  // ── NEW: Pagination ─────────────────────────────────────────────────────────
  pagination: Pagination | null;
  setPagination: (pagination: Pagination) => void;

  // ── Order detail ────────────────────────────────────────────────────────────
  selectedOrder: StoreOrderDetail | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  setLoadingDetail: () => void;
  setSelectedOrder: (order: StoreOrderDetail) => void;
  setDetailError: (message: string) => void;
  clearSelectedOrder: () => void;

  // ── Packing checklist ───────────────────────────────────────────────────────
  packingItems: PackingItem[];
  setPackingItems: (items: PackingItem[]) => void;
  togglePackingItem: (productId: string) => void;
  markAllPacked: () => void;

  // ── Status update ───────────────────────────────────────────────────────────
  isUpdatingStatus: boolean;
  setUpdatingStatus: (value: boolean) => void;
  updateOrderStatusLocally: (orderId: string, status: StoreOrder["orderStatus"]) => void;
}

export const useStoreOrdersStore = create<StoreOrdersState>((set) => ({
  // ── Filter tab ──────────────────────────────────────────────────────────────
  activeTab: "ALL",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Orders list ─────────────────────────────────────────────────────────────
  orders: [],
  isLoadingOrders: false,
  ordersError: null,
  setLoadingOrders: () => set({ isLoadingOrders: true, ordersError: null }),
  setOrders: (orders) => set({ orders, isLoadingOrders: false, ordersError: null }),
  setOrdersError: (message) => set({ isLoadingOrders: false, ordersError: message }),

  // ── NEW: Pagination ─────────────────────────────────────────────────────────
  pagination: null,
  setPagination: (pagination) => set({ pagination }),

  // ── Order detail ────────────────────────────────────────────────────────────
  selectedOrder: null,
  isLoadingDetail: false,
  detailError: null,
  setLoadingDetail: () => set({ isLoadingDetail: true, detailError: null }),
  setSelectedOrder: (order) =>
    set({ selectedOrder: order, isLoadingDetail: false, detailError: null }),
  setDetailError: (message) => set({ isLoadingDetail: false, detailError: message }),
  clearSelectedOrder: () => set({ selectedOrder: null }),

  // ── Packing checklist ───────────────────────────────────────────────────────
  packingItems: [],
  setPackingItems: (items) => set({ packingItems: items }),
  togglePackingItem: (productId) =>
    set((state) => ({
      packingItems: state.packingItems.map((item) =>
        item.productId === productId ? { ...item, isPacked: !item.isPacked } : item
      ),
    })),
  markAllPacked: () =>
    set((state) => ({
      packingItems: state.packingItems.map((item) => ({ ...item, isPacked: true })),
    })),

  // ── Status update ───────────────────────────────────────────────────────────
  isUpdatingStatus: false,
  setUpdatingStatus: (value) => set({ isUpdatingStatus: value }),
  updateOrderStatusLocally: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, orderStatus: status } : o
      ),
      selectedOrder:
        state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, orderStatus: status }
          : state.selectedOrder,
    })),
}));