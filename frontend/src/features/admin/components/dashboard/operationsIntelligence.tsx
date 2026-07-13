import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import { useDashboardState } from "../../state/dashboardState";

/**
 * QuickOps Admin — Operations Intelligence Card
 * Stack: React + TypeScript + Tailwind CSS + recharts
 *
 * Single card, three tabs — all fed from GET /admin/dashboard/operations:
 * Revenue Trend (last 7 days, bar), Order Status (last 30 days, donut),
 * System Health (driver/store live status, simple bars).
 *
 * Order Status only shows the 4 buckets the real orderStatus enum maps to
 * (Delivered / Processing / Out for Delivery / Cancelled) — "Refunded" was
 * dropped from the old mock because refunds aren't tracked as a distinct
 * state anywhere in the schema yet.
 */

type TabId = "revenue" | "orders" | "health";

const TABS: { id: TabId; label: string }[] = [
  { id: "revenue", label: "Revenue Trend" },
  { id: "orders", label: "Order Status" },
  { id: "health", label: "System Health" },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  Delivered: "#8B6F47",
  Processing: "#D9A441",
  "Out for Delivery": "#4F7FD9",
  Cancelled: "#D94F4F",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;
  return (
    <div className="rounded-lg bg-[#2A1F18] px-3 py-1.5 text-[12px] font-semibold text-[#F4EDE2] shadow-lg">
      ₹{value.toLocaleString("en-IN")}
    </div>
  );
}

function HealthBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
        <span className="text-[#5A4A3A]">{label}</span>
        <span className="font-semibold text-[#2A1F18]">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0E6D6]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function OperationsIntelligence() {
  const [activeTab, setActiveTab] = useState<TabId>("revenue");
  const {
    revenueTrend,
    orderStatus,
    driverHealth,
    storeHealth,
    operationsLoading,
    operationsError,
    fetchOperations,
  } = useDashboardState();

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const orderStatusData = orderStatus
    ? Object.entries(orderStatus).map(([name, value]) => ({
        name,
        value,
        color: ORDER_STATUS_COLORS[name],
      }))
    : [];
  const totalOrders = orderStatusData.reduce((sum, d) => sum + d.value, 0);

  const driverMax = driverHealth
    ? driverHealth.ONLINE + driverHealth.BUSY + driverHealth.OFFLINE
    : 0;
  const storeMax = storeHealth
    ? storeHealth.OPEN + storeHealth.BUSY + storeHealth.CLOSED
    : 0;

  return (
    <div className="rounded-2xl border border-[#EBE1D2] bg-white">
      {/* Tabs */}
      <div className="flex items-center gap-7 border-b border-[#EBE1D2] px-6 pt-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-4 text-[14.5px] font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#2A1F18]"
                : "text-[#A2937F] hover:text-[#5A4A3A]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-[#8B6F47]" />
            )}
          </button>
        ))}
      </div>

      <div className="px-6 pb-5 pt-4">
        {operationsError && (
          <p className="py-6 text-center text-[13px] text-[#D94F4F]">{operationsError}</p>
        )}

        {!operationsError && operationsLoading && !orderStatus && (
          <div className="flex h-[190px] items-center justify-center text-[13px] text-[#A2937F]">
            Loading…
          </div>
        )}

        {!operationsError && (revenueTrend.length > 0 || orderStatus || driverHealth) && (
          <>
            {activeTab === "revenue" && (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={revenueTrend} barCategoryGap="32%" margin={{ left: -10 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#A2937F", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#FBF6EE" }} content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={40}>
                    {revenueTrend.map((entry, i) => (
                      <Cell key={i} fill={entry.active ? "#8B6F47" : "#E4D5BD"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeTab === "orders" && totalOrders > 0 && (
              <div className="flex items-center gap-10">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {orderStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-1 flex-col gap-3">
                  {orderStatusData.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-[13.5px] text-[#5A4A3A]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </span>
                      <span className="text-[13.5px] font-semibold text-[#2A1F18]">
                        {status.value}{" "}
                        <span className="font-normal text-[#A2937F]">
                          ({Math.round((status.value / totalOrders) * 100)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "orders" && totalOrders === 0 && (
              <div className="flex h-[190px] items-center justify-center text-[13px] text-[#A2937F]">
                No orders in the last 30 days.
              </div>
            )}

            {activeTab === "health" && driverHealth && storeHealth && (
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="mb-4 text-[13px] font-semibold text-[#3A2C20]">
                    Driver Status
                  </p>
                  <div className="flex flex-col gap-4">
                    <HealthBar label="Online" value={driverHealth.ONLINE} max={driverMax} color="#3FA96A" />
                    <HealthBar label="On Delivery" value={driverHealth.BUSY} max={driverMax} color="#4F7FD9" />
                    <HealthBar label="Offline" value={driverHealth.OFFLINE} max={driverMax} color="#C9BCAC" />
                  </div>
                </div>
                <div>
                  <p className="mb-4 text-[13px] font-semibold text-[#3A2C20]">
                    Store Status
                  </p>
                  <div className="flex flex-col gap-4">
                    <HealthBar label="Open" value={storeHealth.OPEN} max={storeMax} color="#3FA96A" />
                    <HealthBar label="Busy" value={storeHealth.BUSY} max={storeMax} color="#D9A441" />
                    <HealthBar label="Closed" value={storeHealth.CLOSED} max={storeMax} color="#C9BCAC" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}