import type { DashboardData } from "../types/store";

export function getMockDashboardData(): DashboardData {
  return {
    store: {
      storeName: "QuickKart - MG Road",
      visibility: "Open",
      todaysHours: "08:00 – 22:00",
    },
    kpis: {
      todaysOrders: {
        value: "42",
        trend: "+12% vs yesterday",
        trendTone: "positive",
      },
      todaysRevenue: {
        value: "$1,240.50",
        trend: "+5.4%",
        trendTone: "positive",
      },
      pendingOrders: {
        value: "8",
        trend: "High Priority",
        trendTone: "neutral",
      },
      lowStockAlerts: {
        value: "3",
        trend: "Action Needed",
        trendTone: "alert",
      },
    },
    incomingOrders: [
      {
        id: "#1024",
        customer: "Jane Doe",
        initials: "JD",
        avatarColor: "bg-violet-100 text-violet-600",
        total: "$45.20",
        status: "PREPARING",
      },
      {
        id: "#1025",
        customer: "Mark Smith",
        initials: "MS",
        avatarColor: "bg-sky-100 text-sky-600",
        total: "$112.00",
        status: "NEW",
      },
      {
        id: "#1026",
        customer: "Lisa Ray",
        initials: "LR",
        avatarColor: "bg-amber-100 text-amber-600",
        total: "$28.50",
        status: "PREPARING",
      },
    ],
    bestSelling: [
      { name: "Fresh Milk (1L)", sold: 48, maxSold: 48 },
      { name: "Organic Eggs (12pk)", sold: 32, maxSold: 48 },
      { name: "Sourdough Bread", sold: 29, maxSold: 48 },
    ],
    merchantSupport: {
      allSystemsOnline: true,
    },
  };
}