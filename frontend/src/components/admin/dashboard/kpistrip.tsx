import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

/**
 * QuickOps Admin — KPI Strip
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Compact, glanceable KPI row — not hero-sized cards.
 * Five cards: Orders Today, Revenue Today, Drivers Online,
 * Stores Active, Avg Delivery time.
 */

interface KpiCardData {
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: "up" | "down" | "neutral";
}

const KPI_DATA: KpiCardData[] = [
  { label: "ORDERS TODAY", value: "324", trendLabel: "12%", trendDirection: "up" },
  { label: "REVENUE TODAY", value: "₹1.28L", trendLabel: "8%", trendDirection: "up" },
  { label: "DRIVERS ONLINE", value: "42", trendLabel: "Active", trendDirection: "neutral" },
  { label: "STORES ACTIVE", value: "112", trendLabel: "Ready", trendDirection: "neutral" },
  { label: "AVG DELIVERY", value: "18m", trendLabel: "3m", trendDirection: "down" },
];

function TrendBadge({
  direction,
  label,
}: {
  direction: KpiCardData["trendDirection"];
  label: string;
}) {
  if (direction === "neutral") {
    return (
      <span className="rounded-full bg-[#F0E6D6] px-2 py-0.5 text-[11px] font-medium text-[#8C7C6B]">
        {label}
      </span>
    );
  }
  const Icon: LucideIcon = direction === "up" ? TrendingUp : TrendingDown;
  // For delivery time, "down" is a good thing (faster) — both up/down trends
  // here use a positive green, since direction itself doesn't always mean bad.
  const color = "text-[#3FA96A]";
  return (
    <span className={`flex items-center gap-1 text-[12px] font-semibold ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

export default function KpiStrip() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {KPI_DATA.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-2xl border border-[#EBE1D2] bg-white px-5 py-4"
        >
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#A2937F]">
            {kpi.label}
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[26px] font-bold leading-none text-[#2A1F18]">
              {kpi.value}
            </span>
            <div>
              <TrendBadge direction={kpi.trendDirection} label={kpi.trendLabel} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}