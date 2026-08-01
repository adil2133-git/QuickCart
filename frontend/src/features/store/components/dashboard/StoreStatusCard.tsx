import { Clock, Store as StoreIcon } from "lucide-react";
import type { StoreStatus } from "../../types/dashboard";
import { STORE_STATUS_CONFIG } from "../../lib/dashboardUtils";

interface StoreStatusCardProps {
  status: StoreStatus;
  onStatusChange?: (status: StoreStatus) => void;
  todaysHours?: string;
}

const STATUS_ORDER: StoreStatus[] = ["OPEN", "BUSY", "CLOSED"];

export default function StoreStatusCard({
  status,
  onStatusChange,
  todaysHours = "08:00 – 22:00",
}: StoreStatusCardProps) {
  const config = STORE_STATUS_CONFIG[status];

  return (
    <div className="rounded-2xl border border-[#E3E7E1] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#16241D]">Store Status</h3>
          <p className="mt-0.5 text-sm text-[#6E7C74]">Visibility to customers</p>
        </div>
        <StoreIcon className="h-6 w-6 flex-shrink-0 text-[#9BAAA1]" />
      </div>

      {/* 3-way control: schema supports OPEN / BUSY / CLOSED, not just on/off */}
      <div
        role="radiogroup"
        aria-label="Store status"
        className="mt-4 flex gap-1.5 rounded-full bg-[#F5F7F3] p-1 border border-[#E3E7E1]"
      >
        {STATUS_ORDER.map((value) => {
          const isActive = value === status;
          const label = STORE_STATUS_CONFIG[value].label;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onStatusChange?.(value)}
              className={[
                "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                isActive ? "bg-[#1F4D3D] text-white shadow-sm" : "text-[#6E7C74] hover:text-[#16241D]",
              ].join(" ")}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className={["h-1.5 w-1.5 rounded-full", STORE_STATUS_CONFIG[value].dotClassName].join(" ")} />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[#6E7C74]">
        Customers currently see your store as{" "}
        <span className="font-semibold text-[#16241D]">{config.label.toLowerCase()}</span>.
      </p>

      <div className="my-4 h-px bg-[#E3E7E1]" />

      <div className="flex items-center gap-2 text-sm text-[#6E7C74]">
        <Clock className="h-4 w-4 text-[#1F4D3D]" />
        <span>Today&apos;s Hours: {todaysHours}</span>
      </div>
    </div>
  );
}
