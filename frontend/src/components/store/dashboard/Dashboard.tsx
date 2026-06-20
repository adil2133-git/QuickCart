import { useState } from "react";
import {
  ShoppingCart,
  Wallet,
  ClipboardList,
  ClipboardCheck,
  MoreVertical,
  Clock,
  Headphones,
  ChevronRight,
  Store,
} from "lucide-react";
import type {
  DashboardData,
  Order,
  OrderStatus,
  StoreVisibility,
  TrendTone,
} from "../types/store";

// ---------- Small presentational helpers ----------
function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    PREPARING: "bg-emerald-100 text-emerald-700",
    NEW: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-stone-100 text-stone-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  trend,
  trendTone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendTone?: TrendTone;
}) {
  const trendStyles: Record<TrendTone, string> = {
    positive: "text-emerald-600",
    negative: "text-red-500",
    neutral: "text-stone-400",
    alert: "bg-red-100 text-red-600 px-2 py-0.5 rounded-full",
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
          {icon}
        </div>
        <span className={`text-xs font-medium ${trendStyles[trendTone]}`}>
          {trend}
        </span>
      </div>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-4 items-center px-2 py-4">
      <span className="text-sm font-medium text-stone-900">{order.id}</span>

      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${order.avatarColor}`}
        >
          {order.initials}
        </span>
        <span className="text-sm text-stone-700">{order.customer}</span>
      </div>

      <span className="text-sm text-stone-700">{order.total}</span>

      <div className="flex items-center justify-between">
        <StatusBadge status={order.status} />
        <button
          className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- Main Dashboard ----------
interface DashboardProps {
  data: DashboardData;
}

export default function Dashboard({ data }: DashboardProps) {
  const [storeStatus, setStoreStatus] = useState<StoreVisibility>(
    data.store.visibility
  );

  const statusOptions: { key: StoreVisibility; dot: string }[] = [
    { key: "Open", dot: "bg-emerald-500" },
    { key: "Busy", dot: "bg-amber-500" },
    { key: "Closed", dot: "bg-stone-400" },
  ];

  return (
    <main className="flex-1 space-y-6 p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Today's Orders"
          value={data.kpis.todaysOrders.value}
          trend={data.kpis.todaysOrders.trend}
          trendTone={data.kpis.todaysOrders.trendTone}
        />
        <KpiCard
          icon={<Wallet className="h-5 w-5" />}
          label="Today's Revenue"
          value={data.kpis.todaysRevenue.value}
          trend={data.kpis.todaysRevenue.trend}
          trendTone={data.kpis.todaysRevenue.trendTone}
        />
        <KpiCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Pending Orders"
          value={data.kpis.pendingOrders.value}
          trend={data.kpis.pendingOrders.trend}
          trendTone={data.kpis.pendingOrders.trendTone}
        />
        <KpiCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          label="Low Stock Alerts"
          value={data.kpis.lowStockAlerts.value}
          trend={data.kpis.lowStockAlerts.trend}
          trendTone={data.kpis.lowStockAlerts.trendTone}
        />
      </div>

      {/* Main grid: Incoming Orders + Sidebar widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Incoming Orders */}
        <div className="rounded-2xl border border-stone-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
            <h2 className="text-base font-semibold text-stone-900">
              Incoming Orders
            </h2>
            <button className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-3">
            <div className="grid grid-cols-4 px-2 pb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Total</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-stone-100">
              {data.incomingOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column widgets */}
        <div className="space-y-6">
          {/* Best Selling Today */}
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-stone-900">
              Best Selling Today
            </h2>
            <div className="space-y-5">
              {data.bestSelling.map((item) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-stone-700">{item.name}</span>
                    <span className="text-stone-500">{item.sold} sold</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-100">
                    <div
                      className="h-1.5 rounded-full bg-[#A9764C]"
                      style={{
                        width: `${(item.sold / item.maxSold) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Store Status */}
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  Store Status
                </h2>
                <p className="text-sm text-stone-400">
                  Visibility to customers
                </p>
              </div>
              <Store className="h-5 w-5 text-stone-300" />
            </div>

            <div className="flex rounded-full bg-stone-100 p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setStoreStatus(option.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium transition ${
                    storeStatus === option.key
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-400"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${option.dot}`} />
                  {option.key}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-stone-500">
              Customers currently see your store as{" "}
              <span className="font-semibold text-stone-700">
                {storeStatus.toLowerCase()}
              </span>
              .
            </p>

            <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4 text-sm text-stone-500">
              <Clock className="h-4 w-4" />
              Today's Hours: {data.store.todaysHours}
            </div>
          </div>

          {/* Merchant Support */}
          <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                <Headphones className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  Merchant Support
                </h2>
                <p className="text-sm text-stone-400">
                  Live chat available 24/7
                </p>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm">
              <span className="text-stone-500">Integration Status</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {data.merchantSupport.allSystemsOnline
                  ? "ALL SYSTEMS ONLINE"
                  : "SOME SYSTEMS DOWN"}
              </span>
            </div>

            <button className="w-full rounded-full border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Open Support Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Low Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#2B1B12] p-8">
        <div className="flex items-center justify-between gap-6">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-white">
              Inventory Low?
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Restock your top items with one click using AI auto-refill.
            </p>
            <button className="mt-5 rounded-full bg-[#C99A6C] px-5 py-2.5 text-sm font-semibold text-[#2B1B12] hover:bg-[#d6ab80]">
              Restock Now
            </button>
          </div>
          <div className="hidden h-32 w-44 shrink-0 overflow-hidden rounded-xl sm:block">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop"
              alt="Fresh produce shelf"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}