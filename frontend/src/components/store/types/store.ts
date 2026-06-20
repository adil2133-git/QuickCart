export type TrendTone = "positive" | "negative" | "neutral" | "alert";
export type OrderStatus = "PREPARING" | "NEW" | "COMPLETED";
export type StoreVisibility = "Open" | "Busy" | "Closed";

export interface KpiData {
  value: string; // pre-formatted, e.g. "42" or "$1,240.50"
  trend: string; // e.g. "+12% vs yesterday"
  trendTone: TrendTone;
}

export interface Order {
  id: string;
  customer: string;
  initials: string;
  avatarColor: string; // tailwind classes, e.g. "bg-violet-100 text-violet-600"
  total: string;
  status: OrderStatus;
}

export interface BestSellingItem {
  name: string;
  sold: number;
  maxSold: number; // used to size the progress bar
}

export interface DashboardData {
  store: {
    storeName: string;
    visibility: StoreVisibility;
    todaysHours: string; // e.g. "08:00 – 22:00"
  };
  kpis: {
    todaysOrders: KpiData;
    todaysRevenue: KpiData;
    pendingOrders: KpiData;
    lowStockAlerts: KpiData;
  };
  incomingOrders: Order[];
  bestSelling: BestSellingItem[];
  merchantSupport: {
    allSystemsOnline: boolean;
  };
}