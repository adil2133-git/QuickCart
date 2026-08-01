import { AlertTriangle } from "lucide-react";

// ─── Shown when the order the store is currently viewing/packing gets ────────
// cancelled by the customer in real time. A toast alone is easy to miss when
// someone's heads-down on a packing checklist, so this blocks the screen and
// forces an acknowledgement before sending them back to the orders list.
export function OrderCancelledModal({
  orderNumber,
  onAcknowledge,
}: {
  orderNumber: string;
  onAcknowledge: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 font-['Inter',sans-serif]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl border border-[#E3E7E1]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#16241D]">Order Cancelled</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6E7C74]">
          The customer cancelled order <span className="font-semibold text-[#16241D]">#{orderNumber}</span>{" "}
          just now. No further action is needed on your end — you can stop packing this one.
        </p>

        <button
          onClick={onAcknowledge}
          className="mt-5 w-full rounded-full bg-[#1F4D3D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163D30] cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    </div>
  );
}