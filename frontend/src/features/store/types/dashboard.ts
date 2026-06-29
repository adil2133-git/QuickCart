export interface DashboardKpi {
  value: number;
  trendPct?: number | null;
}

export interface DashboardOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
}

export interface BestSellingItem {
  name: string;
  sold: number;
  maxSold: number;
}

export interface LowStockProduct {
  name: string;
  stockQuantity: number;
}

export type StoreVisibility = "OPEN" | "CLOSED" | "BUSY";

export interface OperatingHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface DashboardSummary {
  store: {
    storeName: string;
    visibility: StoreVisibility;
    isManuallyClosed: boolean;
    operatingHours: OperatingHour[];
  };
  kpis: {
    todaysOrders: DashboardKpi;
    todaysRevenue: DashboardKpi;
    pendingOrders: DashboardKpi;
    lowStockAlerts: DashboardKpi;
  };
  incomingOrders: DashboardOrder[];
  bestSelling: BestSellingItem[];
  lowStockProducts: LowStockProduct[];
}

export interface GetDashboardSummaryResponse {
  success: boolean;
  store: DashboardSummary["store"];
  kpis: DashboardSummary["kpis"];
  incomingOrders: DashboardOrder[];
  bestSelling: BestSellingItem[];
  lowStockProducts: LowStockProduct[];
}