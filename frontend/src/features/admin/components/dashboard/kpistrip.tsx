import { useEffect } from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { useDashboardState } from "../../state/dashboardState";

/**
 * QuickOps Admin — KPI Strip
 * Stack: React + TypeScript + Tailwind CSS + lucide-react
 *
 * Compact, glanceable KPI row — pulled live from
 * GET /admin/dashboard/kpis. Five cards: Orders Today, Revenue Today,
 * Drivers Online, Stores Active, Avg Delivery time.
 */

function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value}`;
}

function TrendBadge({
  direction,
  label,
}: {
  direction?: "up" | "down" | "neutral";
  label?: string;
}) {
  if (!direction || !label) return null;
  if (direction === "neutral") {
    return (
      <span className="rounded-full bg-[#F0E6D6] px-2 py-0.5 text-[11px] font-medium text-[#8C7C6B]">
        {label}
      </span>
    );
  }
  const Icon: LucideIcon = direction === "up" ? TrendingUp : TrendingDown;
  // Direction alone doesn't mean good/bad here (a "down" avg-delivery-time
  // trend is actually good), so this just always renders in the same
  // neutral-positive green rather than guessing intent per-card.
  const color = "text-[#3FA96A]";
  return (
    <span className={`flex items-center gap-1 text-[12px] font-semibold ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#EBE1D2] bg-white px-5 py-4 animate-pulse">
      <div className="mb-3 h-3 w-20 rounded bg-[#F0E6D6]" />
      <div className="h-6 w-16 rounded bg-[#F0E6D6]" />
    </div>
  );
}

export default function KpiStrip() {
  const { kpis, kpisLoading, kpisError, fetchKpis } = useDashboardState();

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  if (kpisLoading && !kpis) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (kpisError) {
    return (
      <div className="rounded-2xl border border-[#F5D8D8] bg-[#FBEAEA] px-5 py-4 text-[13px] text-[#D94F4F]">
        {kpisError}
      </div>
    );
  }

  if (!kpis) return null;

  const cards: { label: string; value: string; direction?: "up" | "down" | "neutral"; trendLabel?: string }[] = [
    {
      label: "ORDERS TODAY",
      value: String(kpis.ordersToday.value),
      direction: kpis.ordersToday.direction,
      trendLabel: kpis.ordersToday.label,
    },
    {
      label: "REVENUE TODAY",
      value: formatCurrency(kpis.revenueToday.value),
      direction: kpis.revenueToday.direction,
      trendLabel: kpis.revenueToday.label,
    },
    {
      label: "DRIVERS ONLINE",
      value: String(kpis.driversOnline.value),
      direction: "neutral",
      trendLabel: "Active",
    },
    {
      label: "STORES ACTIVE",
      value: String(kpis.storesActive.value),
      direction: "neutral",
      trendLabel: "Open now",
    },
    {
      label: "AVG DELIVERY",
      value: kpis.avgDeliveryMinutes.value ? `${kpis.avgDeliveryMinutes.value}m` : "—",
      direction: kpis.avgDeliveryMinutes.direction,
      trendLabel: kpis.avgDeliveryMinutes.label,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((kpi) => (
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
              <TrendBadge direction={kpi.direction} label={kpi.trendLabel} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}