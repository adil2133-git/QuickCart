// src/features/driver/types/driverDashboard.types.ts

export interface OrderRequest {
  id: string;
  store: string;
  earnings: string;
  distance: string;
  route: string;
}

export interface ActivityItem {
  icon: string;
  iconColor: "green" | "brown";
  title: string;
  description: string;
  time: string;
  amount: string;
  amountColor: "green" | "brown";
}

export interface OverviewCard {
  icon: string;
  label: string;
  value: string;
  badge: string | null;
}

export interface DriverDashboardState {
  online: boolean;
  orders: OrderRequest[];
  overviewCards: OverviewCard[];
  activityItems: ActivityItem[];
  isLoading: boolean;
  error: string | null;
}