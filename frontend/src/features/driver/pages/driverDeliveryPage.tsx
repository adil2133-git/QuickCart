// src/features/driver/components/CompletedHistoryTab.tsx
import { useEffect } from "react";
import { Package, IndianRupee, CalendarClock } from "lucide-react";
import { useDriverDeliveryActions } from "../hooks/useDriverDelivery";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import type { CompletedDelivery } from "../types/driverDelivery";

// ─── Row ──────────────────────────────────────────────────────────────────────

function CompletedRow({ delivery }: { delivery: CompletedDelivery }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#EADFD3] bg-white p-5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F5EDE5]">
          <Package className="h-5 w-5 text-[#7A6350]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2B1B0E]">#{delivery.orderNumber}</p>
          <p className="truncate text-xs text-[#A38F7D]">{delivery.storeName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#A38F7D]">
        <CalendarClock className="h-3.5 w-3.5" />
        {new Date(delivery.completedAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>

      <div className="flex items-center gap-1 text-sm font-bold text-[#2B7A3E]">
        <IndianRupee className="h-3.5 w-3.5" />
        {delivery.earnings.toFixed(2)}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CompletedHistoryTab() {
  const completedDeliveries = useDriverDeliveryStore((s) => s.completedDeliveries);
  const completedLoading = useDriverDeliveryStore((s) => s.completedLoading);
  const completedError = useDriverDeliveryStore((s) => s.completedError);
  const completedPage = useDriverDeliveryStore((s) => s.completedPage);
  const completedPages = useDriverDeliveryStore((s) => s.completedPages);

  const { fetchCompleted } = useDriverDeliveryActions();

  // Initial load handled by parent page; this guards direct mounts too
  useEffect(() => {
    if (completedDeliveries.length === 0 && !completedLoading) {
      fetchCompleted(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (completedLoading && completedDeliveries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-[#A38F7D]">
        Loading delivery history…
      </div>
    );
  }

  if (completedError) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{completedError}</div>
    );
  }

  if (completedDeliveries.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#EADFD3] text-center">
        <p className="font-medium text-[#7A6350]">No completed deliveries yet</p>
        <p className="text-sm text-[#A38F7D]">Your delivery history will show up here.</p>
      </div>
    );
  }

  const hasMore = completedPage < completedPages;

  return (
    <div className="space-y-3">
      {completedDeliveries.map((d) => (
        <CompletedRow key={d.orderId} delivery={d} />
      ))}

      {hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => fetchCompleted(completedPage + 1)}
            disabled={completedLoading}
            className="rounded-xl border border-[#EADFD3] px-6 py-2.5 text-sm font-semibold text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5] disabled:opacity-60"
          >
            {completedLoading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}