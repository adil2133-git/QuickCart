// src/features/driver/components/ActiveDeliveryTab.tsx
import { useState } from "react";
import {
  Store,
  User,
  Package,
  CreditCard,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Circle,
  IndianRupee,
  Banknote,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { ActiveDelivery } from "../types/driverDelivery";
import { useDriverDeliveryActions, STAGE_LABELS, STAGE_ORDER } from "../hooks/useDriverDelivery";

// ─── Progress Step ────────────────────────────────────────────────────────────

function ProgressStep({
  label,
  status,
  completedAt,
  isLast,
}: {
  label: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  completedAt?: string | null;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Icon + connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 items-center justify-center">
          {status === "COMPLETED" ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : status === "IN_PROGRESS" ? (
            <div className="h-5 w-5 rounded-full border-[3px] border-[#145C43] bg-white" />
          ) : (
            <Circle className="h-5 w-5 text-[#9BAAA1]" />
          )}
        </div>
        {!isLast && (
          <div
            className={[
              "my-1 w-0.5 flex-1",
              status === "COMPLETED" ? "bg-emerald-400" : "bg-[#E3E7E1]",
            ].join(" ")}
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Text */}
      <div className="pb-5 pt-0.5">
        <p
          className={[
            "text-sm font-semibold",
            status === "PENDING" ? "text-[#6E7C74]" : "text-[#16241D]",
          ].join(" ")}
        >
          {label}
        </p>
        {completedAt && (
          <p className="text-xs text-[#6E7C74]">
            Completed at{" "}
            {new Date(completedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({ delivery }: { delivery: ActiveDelivery }) {
  const stage = delivery.currentStage;
  const isDelivered = stage === "DELIVERED";
  const { advanceStage } = useDriverDeliveryActions();
  const [loading, setLoading] = useState(false);

  const handlePrimary = () => {
    toast.info("Opening navigation…");
  };

  const handleAdvance = async () => {
    const idx = STAGE_ORDER.indexOf(stage);
    if (idx === -1 || idx >= STAGE_ORDER.length - 1) return;
    const next = STAGE_ORDER[idx + 1];

    setLoading(true);
    try {
      await advanceStage(delivery.orderId, next);
    } catch {
      toast.error("Failed to update status. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isDelivered) {
    return (
      <button
        type="button"
        onClick={() => {}}
        className="w-full rounded-xl bg-[#145C43] py-3 text-sm font-semibold text-white"
      >
        Back to Dashboard
      </button>
    );
  }

  const isCOD = delivery.paymentMethod === "COD";
  const showCashFirst = stage === "REACHED_CUSTOMER" && isCOD && !delivery.cashCollected;

  const secondaryLabel = (() => {
    switch (stage) {
      case "NAVIGATE_TO_STORE":    return "Reached Store";
      case "REACHED_STORE":        return "Picked Up";
      case "PICKED_UP":            return "Out for Delivery";
      case "NAVIGATE_TO_CUSTOMER": return "Arrived";
      case "REACHED_CUSTOMER":     return showCashFirst ? "Arrived" : "Mark Delivered";
      default: return "Next";
    }
  })();

  const secondaryVariant = (() => {
    if (stage === "NAVIGATE_TO_CUSTOMER" || stage === "REACHED_CUSTOMER") return "green";
    if (stage === "REACHED_STORE") return "muted";
    return "dark";
  })();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePrimary}
        className="w-full rounded-xl border border-[#E3E7E1] py-3 text-sm font-semibold text-[#16241D] transition-colors hover:bg-[#F5F7F3]"
      >
        <span className="flex items-center justify-center gap-2">
          <Navigation className="h-4 w-4" />
          {stage === "NAVIGATE_TO_STORE" || stage === "REACHED_STORE"
            ? "Navigate To Store"
            : "Navigate to Customer"}
        </span>
      </button>

      <button
        type="button"
        onClick={showCashFirst ? undefined : handleAdvance}
        disabled={loading}
        className={[
          "w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60",
          secondaryVariant === "green"
            ? "bg-[#145C43] text-white hover:bg-[#114E39]"
            : secondaryVariant === "muted"
            ? "bg-[#E8EFEC] text-[#145C43] hover:bg-[#DCE3DC]"
            : "bg-[#145C43] text-white hover:bg-[#114E39]",
        ].join(" ")}
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            secondaryLabel
          )}
        </span>
      </button>
    </div>
  );
}

// ─── No Active Delivery ───────────────────────────────────────────────────────

function EmptyActiveDelivery() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E3E7E1]">
      <Package className="h-10 w-10 text-[#9BAAA1]" />
      <p className="font-semibold text-[#6E7C74]">No active delivery</p>
      <p className="text-sm text-[#6E7C74]">Accept a request to start delivering.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActiveDeliveryTab({
  delivery,
  loading,
  error,
}: {
  delivery: ActiveDelivery | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <div className="flex h-64 items-center justify-center text-[#6E7C74]">Loading…</div>;
  if (error) return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (!delivery) return <EmptyActiveDelivery />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Col 1: Main Active Card ────────────────────────────────────────── */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-[#E8EFEC] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#145C43]">
              Active
            </span>
            <span className="text-xs font-bold text-[#16241D]">#{delivery.orderNumber}</span>
          </div>

          <div className="mb-5 flex h-40 items-center justify-center rounded-xl bg-[#F5F7F3] border border-[#E3E7E1]">
            <div className="text-center text-[#6E7C74]">
              <MapPin className="mx-auto h-8 w-8 text-[#145C43]" />
              <p className="mt-1 text-xs font-semibold">Live Route Map</p>
            </div>
          </div>

          <div className="mb-5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFEC]">
                <Store className="h-4 w-4 text-[#145C43]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Store</p>
                <p className="text-sm font-semibold text-[#16241D]">{delivery.store.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFEC]">
                <User className="h-4 w-4 text-[#145C43]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Customer</p>
                <p className="text-sm font-semibold text-[#16241D]">{delivery.customer.name}</p>
              </div>
            </div>
          </div>

          <div className="mb-5 flex gap-3">
            <div className="flex-1 rounded-xl bg-[#F5F7F3] px-4 py-3 border border-[#E3E7E1]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Items</p>
              <p className="text-sm font-bold text-[#16241D]">{delivery.itemCount} Products</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F5F7F3] px-4 py-3 border border-[#E3E7E1]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Payment</p>
              <p className="text-sm font-bold text-[#16241D]">
                ₹{delivery.amountToCollect}{" "}
                <span className="text-xs font-normal">({delivery.paymentMethod})</span>
              </p>
            </div>
          </div>

          <ActionButtons delivery={delivery} />
        </div>
      </div>

      {/* ── Col 2: Store + Customer contact cards ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            {delivery.store.logoUrl ? (
              <img src={delivery.store.logoUrl} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFEC]">
                <Store className="h-6 w-6 text-[#145C43]" />
              </div>
            )}
            <div>
              <p className="font-semibold text-[#16241D]">{delivery.store.name}</p>
              <p className="text-sm text-[#6E7C74]">{delivery.store.address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${delivery.store.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E7E1] py-2.5 text-sm font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
              <Phone className="h-4 w-4" /> Call Store
            </a>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E7E1] py-2.5 text-sm font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
              <Navigation className="h-4 w-4" /> Navigate
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFEC]">
              <User className="h-6 w-6 text-[#145C43]" />
            </div>
            <div>
              <p className="font-semibold text-[#16241D]">{delivery.customer.name}</p>
              <p className="text-sm text-[#6E7C74]">{delivery.customer.address}</p>
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <a href={`tel:${delivery.customer.phone}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E7E1] py-2.5 text-sm font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
              <Phone className="h-4 w-4" /> Call
            </a>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E7E1] py-2.5 text-sm font-medium text-[#16241D] transition-colors hover:bg-[#F5F7F3]">
              <MessageSquare className="h-4 w-4" /> Message
            </button>
          </div>
          {delivery.customer.deliveryInstruction && (
            <div className="rounded-xl border border-dashed border-[#DCE3DC] bg-[#F5F7F3] p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6E7C74]">Instruction</p>
              <p className="text-sm italic text-[#16241D]">"{delivery.customer.deliveryInstruction}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Col 3: Progress + Payment ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
          <h3 className="mb-5 text-sm font-bold text-[#16241D]">Delivery Progress</h3>
          <div>
            {STAGE_ORDER.map((stageKey, idx) => {
              const step = delivery.progressSteps.find((s) => s.key === stageKey);
              return (
                <ProgressStep
                  key={stageKey}
                  label={STAGE_LABELS[stageKey]}
                  status={step?.status ?? "PENDING"}
                  completedAt={step?.completedAt}
                  isLast={idx === STAGE_ORDER.length - 1}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[#145C43]" />
            <h3 className="text-sm font-bold text-[#16241D]">Payment Info</h3>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#6E7C74]">Method</span>
            <span className="font-bold text-[#16241D]">{delivery.paymentMethod === "COD" ? "Cash" : "Online"}</span>
          </div>
          {delivery.paymentMethod === "COD" && (
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-[#6E7C74]">Amount</span>
              <span className="flex items-center font-bold text-[#16241D]">
                <IndianRupee className="h-3.5 w-3.5" />
                {delivery.amountToCollect.toFixed(2)}
              </span>
            </div>
          )}

          {/* Cash collection button */}
          {delivery.paymentMethod === "COD" && (
            <CashCollectButton delivery={delivery} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cash Collect Button ──────────────────────────────────────────────────────

function CashCollectButton({ delivery }: { delivery: ActiveDelivery }) {
  const { confirmCashCollected } = useDriverDeliveryActions();
  const { advanceStage } = useDriverDeliveryActions();
  const [loading, setLoading] = useState(false);
  const isActive =
    delivery.currentStage === "REACHED_CUSTOMER" && !delivery.cashCollected;
  const isCollected = delivery.cashCollected;
  const isDelivered = delivery.currentStage === "DELIVERED";

  const handleCashAndDeliver = async () => {
    setLoading(true);
    try {
      await confirmCashCollected(delivery.orderId);
      await advanceStage(delivery.orderId, "DELIVERED");
      toast.success("Order delivered and payment received!");
    } catch {
      toast.error("Failed to complete. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isDelivered || isCollected) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A5C2E] py-3 text-sm font-semibold text-white"
      >
        <CheckCircle2 className="h-4 w-4" />
        Payment Received
      </button>
    );
  }

  if (isActive) {
    return (
      <>
        <button
          type="button"
          onClick={handleCashAndDeliver}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#145C43] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#114E39] disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          {loading ? "Confirming…" : "Cash Collected"}
        </button>
        <p className="mt-2 text-center text-xs text-[#6E7C74]">
          Please collect payment to complete delivery
        </p>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#F5F7F3] py-3 text-sm font-semibold text-[#9BAAA1]"
      >
        <CreditCard className="h-4 w-4" />
        Cash Collected
      </button>
      <p className="mt-2 text-center text-xs text-[#6E7C74]">
        Active only after delivery confirmation
      </p>
    </>
  );
}