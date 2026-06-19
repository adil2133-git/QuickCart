import { useState } from "react";
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

/**
 * QuickOps Admin — Operations Intelligence Card
 * Stack: React + TypeScript + Tailwind CSS + recharts
 *
 * Single card, three tabs, instead of multiple full-size charts
 * competing for space: Revenue Trend (bar), Order Status (donut),
 * System Health (simple bars).
 */

type TabId = "revenue" | "orders" | "health";

const TABS: { id: TabId; label: string }[] = [
  { id: "revenue", label: "Revenue Trend" },
  { id: "orders", label: "Order Status" },
  { id: "health", label: "System Health" },
];

const REVENUE_DATA = [
  { day: "Mon", value: 11200 },
  { day: "Tue", value: 14800 },
  { day: "Wed", value: 12600 },
  { day: "Thu", value: 16400 },
  { day: "Fri", value: 13900 },
  { day: "Sat", value: 18420, active: true },
  { day: "Sun", value: 17100 },
];

const ORDER_STATUS_DATA = [
  { name: "Delivered", value: 612, color: "#8B6F47" },
  { name: "Processing", value: 84, color: "#D9A441" },
  { name: "Out for Delivery", value: 96, color: "#4F7FD9" },
  { name: "Cancelled", value: 22, color: "#D94F4F" },
  { name: "Refunded", value: 14, color: "#C9BCAC" },
];

const DRIVER_HEALTH = [
  { label: "Online", value: 42, max: 60, color: "#3FA96A" },
  { label: "On Delivery", value: 28, max: 60, color: "#4F7FD9" },
  { label: "Idle", value: 9, max: 60, color: "#D9A441" },
  { label: "Offline", value: 6, max: 60, color: "#C9BCAC" },
];

const STORE_HEALTH = [
  { label: "Active", value: 112, max: 130, color: "#3FA96A" },
  { label: "Offline", value: 5, max: 130, color: "#C9BCAC" },
  { label: "Delayed", value: 9, max: 130, color: "#D9A441" },
  { label: "Under Review", value: 3, max: 130, color: "#D94F4F" },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#2A1F18] px-3 py-1.5 text-[12px] font-semibold text-[#F4EDE2] shadow-lg">
      ₹{payload[0].value.toLocaleString("en-IN")}
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
  const pct = Math.min(100, (value / max) * 100);
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
  const totalOrders = ORDER_STATUS_DATA.reduce((sum, d) => sum + d.value, 0);

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
        {activeTab === "revenue" && (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={REVENUE_DATA} barCategoryGap="32%" margin={{ left: -10 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A2937F", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "#FBF6EE" }} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 6, 6]} maxBarSize={40}>
                {REVENUE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.active ? "#8B6F47" : "#E4D5BD"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "orders" && (
          <div className="flex items-center gap-10">
            <ResponsiveContainer width={240} height={240}>
              <PieChart>
                <Pie
                  data={ORDER_STATUS_DATA}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="none"
                >
                  {ORDER_STATUS_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-1 flex-col gap-3">
              {ORDER_STATUS_DATA.map((status) => (
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

        {activeTab === "health" && (
          <div className="grid grid-cols-2 gap-10">
            <div>
              <p className="mb-4 text-[13px] font-semibold text-[#3A2C20]">
                Driver Health
              </p>
              <div className="flex flex-col gap-4">
                {DRIVER_HEALTH.map((d) => (
                  <HealthBar key={d.label} {...d} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[13px] font-semibold text-[#3A2C20]">
                Store Health
              </p>
              <div className="flex flex-col gap-4">
                {STORE_HEALTH.map((s) => (
                  <HealthBar key={s.label} {...s} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}