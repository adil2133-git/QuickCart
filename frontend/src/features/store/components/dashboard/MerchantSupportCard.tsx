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
    <div className="flex flex-1 flex-col rounded-2xl border border-[#E3E7E1] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#E7EFEA] text-[#1F4D3D]">
          <Headset className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#16241D]">Merchant Support</h3>
          <p className="text-sm text-[#6E7C74]">Live chat available 24/7</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-[#F5F7F3] px-4 py-3">
        <span className="text-sm text-[#6E7C74]">Integration Status</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          <span className={["h-2 w-2 rounded-full", config.dotClassName].join(" ")} />
          {config.label.toUpperCase()}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenTicket}
        className="mt-4 w-full rounded-full border border-[#E3E7E1] py-2.5 text-sm font-semibold text-[#1F4D3D] transition-colors hover:bg-[#F5F7F3] cursor-pointer"
      >
        Open Support Ticket
      </button>
    </div>
  );
}
