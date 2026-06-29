export type StoreStatus = "OPEN" | "BUSY" | "CLOSED";
export type AvailabilityStatus = "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PACKING"
  | "READY_FOR_PICKUP"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface DashboardStats {
  todaysOrders: number;
  todaysOrdersChangePct: number | null;
  todaysRevenue: number;
  todaysRevenueChangePct: number | null;
  pendingOrdersCount: number;
  lowStockCount: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderStatus: OrderStatus;
}

export interface BestSellingItem {
  productId: string;
  productName: string;
  unitsSold: number;
}

export interface LowStockProductSummary {
  productId: string;
  productName: string;
  stockQuantity: number;
}

export interface DashboardSummary {
  storeName: string;
  status: StoreStatus;
  todaysHours: string;
  stats: DashboardStats;
  incomingOrders: Order[];
  bestSelling: BestSellingItem[];
  lowStockProducts: LowStockProductSummary[];
}