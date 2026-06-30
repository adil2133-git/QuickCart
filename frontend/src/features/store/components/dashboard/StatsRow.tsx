import { ShoppingCart, Wallet, ClipboardList, ClipboardCheck } from "lucide-react";
import StatCard from "./StatCard";import type { DashboardStats } from "../../types/dashboard";
import { formatCurrency } from "../../lib/dashboardUtils";

interface StatsRowProps {
  stats: DashboardStats;
}

export default function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<ShoppingCart className="h-5 w-5" />}
        label="Today's Orders"
        value={stats.todaysOrders}
        badge={{ text: `+${stats.todaysOrdersChangePct}% vs yesterday`, tone: "neutral" }}
      />
      <StatCard
        icon={<Wallet className="h-5 w-5" />}
        label="Today's Revenue"
        value={formatCurrency(stats.todaysRevenue)}
        badge={{ text: `+${stats.todaysRevenueChangePct}%`, tone: "neutral" }}
      />
      <StatCard
        icon={<ClipboardList className="h-5 w-5" />}
        label="Pending Orders"
        value={stats.pendingOrdersCount}
        badge={{ text: "High Priority", tone: "muted" }}
      />
      <StatCard
        icon={<ClipboardCheck className="h-5 w-5" />}
        label="Low Stock Alerts"
        value={stats.lowStockCount}
        badge={{ text: "Action Needed", tone: "danger" }}
      />
    </div>
  );
}
