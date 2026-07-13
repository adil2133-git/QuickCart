// src/features/admin/state/dashboardState.ts
import { create } from "zustand";
import api from "../../../api/axios";

export type TrendDirection = "up" | "down" | "neutral";

interface KpiValue {
  value: number;
  direction?: TrendDirection;
  label?: string;
}

export interface DashboardKpis {
  ordersToday: KpiValue;
  revenueToday: KpiValue;
  driversOnline: KpiValue;
  storesActive: KpiValue;
  avgDeliveryMinutes: KpiValue;
}

export interface RevenueTrendPoint {
  day: string;
  value: number;
  active: boolean;
}

export interface OrderStatusBuckets {
  Delivered: number;
  Processing: number;
  "Out for Delivery": number;
  Cancelled: number;
}

export interface DriverHealth {
  ONLINE: number;
  BUSY: number;
  OFFLINE: number;
}

export interface StoreHealth {
  OPEN: number;
  BUSY: number;
  CLOSED: number;
}

export type OrderStatusLabel = "Delivered" | "Processing" | "Out for Delivery" | "Cancelled";
export type PaymentLabel = "Online" | "COD";

export interface RecentOrder {
  id: string;
  customer: string;
  store: string;
  amount: number;
  payment: PaymentLabel;
  status: OrderStatusLabel;
  createdAt: string;
}

export type AttentionSeverity = "critical" | "warning";

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  type: "stores" | "drivers" | "orders";
  title: string;
  description: string;
  actionLabel: string;
}

export interface ApprovalCard {
  id: string;
  name: string;
  category: string;
  submittedDate: string;
}

interface DashboardState {
  kpis: DashboardKpis | null;
  kpisLoading: boolean;
  kpisError: string | null;

  revenueTrend: RevenueTrendPoint[];
  orderStatus: OrderStatusBuckets | null;
  driverHealth: DriverHealth | null;
  storeHealth: StoreHealth | null;
  operationsLoading: boolean;
  operationsError: string | null;

  recentOrders: RecentOrder[];
  recentOrdersLoading: boolean;
  recentOrdersError: string | null;

  attentionItems: AttentionItem[];
  approvalQueue: { stores: ApprovalCard[]; drivers: ApprovalCard[] };
  actionRailLoading: boolean;
  actionRailError: string | null;

  fetchKpis: () => Promise<void>;
  fetchOperations: () => Promise<void>;
  fetchRecentOrders: (search?: string) => Promise<void>;
  fetchActionRail: () => Promise<void>;
  fetchAll: () => void;
}

export const useDashboardState = create<DashboardState>((set, get) => ({
  kpis: null,
  kpisLoading: false,
  kpisError: null,

  revenueTrend: [],
  orderStatus: null,
  driverHealth: null,
  storeHealth: null,
  operationsLoading: false,
  operationsError: null,

  recentOrders: [],
  recentOrdersLoading: false,
  recentOrdersError: null,

  attentionItems: [],
  approvalQueue: { stores: [], drivers: [] },
  actionRailLoading: false,
  actionRailError: null,

  fetchKpis: async () => {
    set({ kpisLoading: true, kpisError: null });
    try {
      const res = await api.get("/admin/dashboard/kpis");
      set({ kpis: res.data.kpis, kpisLoading: false });
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      set({
        kpisLoading: false,
        kpisError: axiosError?.response?.data?.message || "Failed to load KPIs.",
      });
    }
  },

  fetchOperations: async () => {
    set({ operationsLoading: true, operationsError: null });
    try {
      const res = await api.get("/admin/dashboard/operations");
      set({
        revenueTrend: res.data.revenueTrend,
        orderStatus: res.data.orderStatus,
        driverHealth: res.data.driverHealth,
        storeHealth: res.data.storeHealth,
        operationsLoading: false,
      });
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      set({
        operationsLoading: false,
        operationsError: axiosError?.response?.data?.message || "Failed to load operations data.",
      });
    }
  },

  fetchRecentOrders: async (search = "") => {
    set({ recentOrdersLoading: true, recentOrdersError: null });
    try {
      const res = await api.get("/admin/dashboard/recent-orders", { params: { search } });
      set({ recentOrders: res.data.orders, recentOrdersLoading: false });
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      set({
        recentOrdersLoading: false,
        recentOrdersError: axiosError?.response?.data?.message || "Failed to load recent orders.",
      });
    }
  },

  fetchActionRail: async () => {
    set({ actionRailLoading: true, actionRailError: null });
    try {
      const res = await api.get("/admin/dashboard/action-rail");
      set({
        attentionItems: res.data.attentionItems,
        approvalQueue: res.data.approvalQueue,
        actionRailLoading: false,
      });
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      set({
        actionRailLoading: false,
        actionRailError: axiosError?.response?.data?.message || "Failed to load action rail.",
      });
    }
  },

  fetchAll: () => {
    get().fetchKpis();
    get().fetchOperations();
    get().fetchRecentOrders();
    get().fetchActionRail();
  },
}));