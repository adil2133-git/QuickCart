// src/features/driver/state/driverDashboardStore.ts
import { create } from "zustand";
import type {
  DriverDashboardState,
  OrderRequest,
  OverviewCard,
  ActivityItem,
} from "../types/driverDashboard";

// ─── Fallback data (replace with real API responses later) ───────────────────

const FALLBACK_CARDS: OverviewCard[] = [
  { icon: "payments",               label: "Today's Earnings",   value: "₹0.00",  badge: null },
  { icon: "local_shipping",         label: "Today's Deliveries", value: "0",       badge: null },
  { icon: "account_balance_wallet", label: "Wallet Balance",     value: "₹0",      badge: null },
];

const FALLBACK_ORDERS: OrderRequest[] = [
  {
    id: "#ORD155",
    store: "Artisan Bakery",
    earnings: "₹45.00",
    distance: "0.8 km",
    route: "Bakery St. → Sector 12, Park Ave",
  },
  {
    id: "#ORD156",
    store: "Dairy Delight",
    earnings: "₹32.00",
    distance: "1.5 km",
    route: "Milk Colony → Aman Vihar",
  },
];

const FALLBACK_ACTIVITY: ActivityItem[] = [
  {
    icon: "check",
    iconColor: "green",
    title: "Delivery Completed",
    description: "Order #ORD122 delivered to Sector 4",
    time: "12 mins ago",
    amount: "+₹42.00",
    amountColor: "green",
  },
  {
    icon: "account_balance_wallet",
    iconColor: "brown",
    title: "Incentive Added",
    description: "Peak hour bonus for last 5 orders",
    time: "1 hour ago",
    amount: "+₹25.00",
    amountColor: "brown",
  },
];

// ─── Store actions ────────────────────────────────────────────────────────────

interface DriverDashboardActions {
  setOnline: (value: boolean) => void;
  setOrders: (orders: OrderRequest[]) => void;
  removeOrder: (id: string) => void;
  setOverviewCards: (cards: OverviewCard[]) => void;
  setActivityItems: (items: ActivityItem[]) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDriverDashboardStore = create<DriverDashboardState & DriverDashboardActions>(
  (set) => ({
    // State
    online: true,
    orders: FALLBACK_ORDERS,
    overviewCards: FALLBACK_CARDS,
    activityItems: FALLBACK_ACTIVITY,
    isLoading: false,
    error: null,

    // Actions
    setOnline:        (value)  => set({ online: value }),
    setOrders:        (orders) => set({ orders }),
    removeOrder:      (id)     => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
    setOverviewCards: (cards)  => set({ overviewCards: cards }),
    setActivityItems: (items)  => set({ activityItems: items }),
    setLoading:       (value)  => set({ isLoading: value }),
    setError:         (msg)    => set({ error: msg }),
  })
);