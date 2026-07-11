import { useState } from "react";
import { AlertTriangle, X, RefreshCw, Loader2 } from "lucide-react";
import { useCartStore } from "../state/cartState";

export default function ConflictModal() {
  const { conflict, resolveConflict, dismissConflict } = useCartStore();
  const [resolving, setResolving] = useState(false);

  if (!conflict) return null;

  const handleReplace = async () => {
    setResolving(true);
    await resolveConflict(true);
    setResolving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismissConflict}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF3E2] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#92400E]" />
          </div>
          <button
            onClick={dismissConflict}
            className="text-[#9BAAA1] hover:text-[#145C43] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-bold text-[#16241D] mb-2">
          Start a new cart?
        </h3>
        <p className="text-sm text-[#6E7C74] leading-relaxed mb-6">
          Your cart has items from{" "}
          <span className="font-semibold text-[#16241D]">
            {conflict.cartStoreName}
          </span>
          . Adding from{" "}
          <span className="font-semibold text-[#16241D]">
            {conflict.newStoreName}
          </span>{" "}
          will clear your current cart. Orders can only be placed from a single
          store at a time.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleReplace}
            disabled={resolving}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#145C43] text-white text-sm font-semibold hover:bg-[#114E39] disabled:opacity-60 transition-all"
          >
            {resolving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {resolving ? "Clearing cart…" : "Clear cart & add item"}
          </button>
          <button
            onClick={dismissConflict}
            disabled={resolving}
            className="w-full h-11 rounded-xl border border-[#E3E7E1] text-sm font-semibold text-[#4B5563] hover:bg-[#F7F8F5] disabled:opacity-60 transition-all"
          >
            Keep current cart
          </button>
        </div>
      </div>
    </div>
  );
}