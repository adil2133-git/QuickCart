import { Headset } from "lucide-react";

type IntegrationStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

interface MerchantSupportCardProps {
  integrationStatus: IntegrationStatus;
  onOpenTicket?: () => void;
}

const INTEGRATION_STATUS_CONFIG: Record<IntegrationStatus, { label: string; dotClassName: string }> = {
  ONLINE: { label: "All Systems Online", dotClassName: "bg-emerald-500" },
  DEGRADED: { label: "Partial Outage", dotClassName: "bg-amber-500" },
  OFFLINE: { label: "Systems Offline", dotClassName: "bg-red-500" },
};

export default function MerchantSupportCard({ integrationStatus, onOpenTicket }: MerchantSupportCardProps) {
  const config = INTEGRATION_STATUS_CONFIG[integrationStatus];

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-[#EFE6DA] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#F6EDE3] text-[#8A6A4D]">
          <Headset className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2B1B0E]">Merchant Support</h3>
          <p className="text-sm text-[#A38F7D]">Live chat available 24/7</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-[#FBF6F0] px-4 py-3">
        <span className="text-sm text-[#5C4A3A]">Integration Status</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <span className={["h-2 w-2 rounded-full", config.dotClassName].join(" ")} />
          {config.label.toUpperCase()}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenTicket}
        className="mt-4 w-full rounded-full border border-[#E3D5C4] py-2.5 text-sm font-semibold text-[#B08550] transition-colors hover:bg-[#FBF6F0]"
      >
        Open Support Ticket
      </button>
    </div>
  );
}
