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
} from "lucide-react";
import { toast } from "sonner";
import type { ActiveDelivery, DeliveryStage } from "../types/driverDelivery";
import { useDriverDeliveryActions, STAGE_LABELS, STAGE_ORDER } from "../hooks/useDriverDelivery";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";

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
            <div className="h-5 w-5 rounded-full border-[3px] border-[#2B1B0E] bg-white" />
          ) : (
            <Circle className="h-5 w-5 text-[#D0C4B8]" />
          )}
        </div>
        {!isLast && (
          <div
            className={[
              "my-1 w-0.5 flex-1",
              status === "COMPLETED" ? "bg-emerald-400" : "bg-[#EADFD3]",
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
            status === "PENDING" ? "text-[#A38F7D]" : "text-[#2B1B0E]",
          ].join(" ")}
        >
          {label}
        </p>
        {completedAt && (
          <p className="text-xs text-[#A38F7D]">
            Completed at{" "}
            {new Date(completedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {status === "IN_PROGRESS" && !completedAt && (
          <p className="text-xs text-[#C8A37E]">In Progress</p>
        )}
        {status === "PENDING" && (
          <p className="text-xs text-[#A38F7D]">Pending</p>
        )}
      </div>
    </div>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({ delivery }: { delivery: ActiveDelivery }) {
  const { advanceStage, confirmCashCollected } = useDriverDeliveryActions();
  const [loading, setLoading] = useState(false);
  const markCashCollected = useDriverDeliveryStore((s) => s.markCashCollected);

  const stage = delivery.currentStage;
  const isCOD  = delivery.paymentMethod === "COD";
  const cashDone = delivery.cashCollected;
  const isDelivered = stage === "DELIVERED";

  const handleNavigateToStore = () => {
    toast.info("Opening navigation to store…");
  };

  const handleNavigateToCustomer = () => {
    toast.info("Opening navigation to customer…");
  };

  const handlePrimary = () => {
    if (stage === "NAVIGATE_TO_STORE" || stage === "REACHED_STORE") {
      handleNavigateToStore();
    } else {
      handleNavigateToCustomer();
    }
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

  const handleCashCollect = async () => {
    setLoading(true);
    try {
      await confirmCashCollected(delivery.orderId);
      markCashCollected();
      toast.success("Cash collected! Tap 'Mark Delivered' to complete.");
    } catch {
      toast.error("Failed to confirm. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isDelivered) {
    return (
      <button
        type="button"
        onClick={() => {}}
        className="w-full rounded-xl bg-[#2B1B0E] py-3 text-sm font-semibold text-white"
      >
        Back to Dashboard
      </button>
    );
  }

  // "Reached Customer" + COD not collected → show cash collect first
  const showCashFirst = stage === "REACHED_CUSTOMER" && isCOD && !cashDone;

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
        className="w-full rounded-xl border border-[#EADFD3] py-3 text-sm font-semibold text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5]"
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
            ? "bg-[#1A5C2E] text-white hover:bg-[#144A25]"
            : secondaryVariant === "muted"
            ? "bg-[#EDE3D9] text-[#2B1B0E] hover:bg-[#E0D4C6]"
            : "bg-[#2B1B0E] text-white hover:bg-[#3D2A18]",
        ].join(" ")}
      >
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {loading ? "Updating…" : secondaryLabel}
        </span>
      </button>
    </div>
  );
}

// ─── No Active Delivery ───────────────────────────────────────────────────────

function EmptyActiveDelivery() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#EADFD3]">
      <Package className="h-10 w-10 text-[#C8A37E]" />
      <p className="font-semibold text-[#7A6350]">No active delivery</p>
      <p className="text-sm text-[#A38F7D]">Accept a request to start delivering.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ActiveDeliveryTabProps {
  delivery: ActiveDelivery | null;
  loading: boolean;
  error: string | null;
}

export default function ActiveDeliveryTab({
  delivery,
  loading,
  error,
}: ActiveDeliveryTabProps) {
  const isDelivered = delivery?.currentStage === "DELIVERED";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#A38F7D]">
        Loading delivery…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
    );
  }

  if (!delivery) return <EmptyActiveDelivery />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Col 1: Order summary + action buttons ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
          {/* Delivered success banner */}
          {isDelivered && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Order #{delivery.orderNumber} Delivered Successfully
            </div>
          )}

          {/* Order meta */}
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="mb-0.5 text-xs text-[#A38F7D]">ORDER ID: #{delivery.orderNumber}</p>
              {delivery.isPriority && (
                <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  PRIORITY
                </span>
              )}
            </div>
          </div>

          {/* Store + Customer */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EDE5]">
                <Store className="h-4 w-4 text-[#7A6350]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A38F7D]">Store</p>
                <p className="text-sm font-semibold text-[#2B1B0E]">{delivery.store.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EDE5]">
                <User className="h-4 w-4 text-[#7A6350]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A38F7D]">Customer</p>
                <p className="text-sm font-semibold text-[#2B1B0E]">{delivery.customer.name}</p>
              </div>
            </div>
          </div>

          {/* Items + Payment */}
          <div className="mb-5 flex gap-3">
            <div className="flex-1 rounded-xl bg-[#F5EDE5] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A38F7D]">Items</p>
              <p className="text-sm font-bold text-[#2B1B0E]">{delivery.itemCount} Products</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F5EDE5] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A38F7D]">Payment</p>
              <p className="text-sm font-bold text-[#2B1B0E]">
                ₹{delivery.amountToCollect}{" "}
                <span className="text-xs font-normal">({delivery.paymentMethod})</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <ActionButtons delivery={delivery} />
        </div>
      </div>

      {/* ── Col 2: Store + Customer contact cards ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Store card */}
        <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            {delivery.store.logoUrl ? (
              <img
                src={delivery.store.logoUrl}
                alt={delivery.store.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EDE5]">
                <Store className="h-6 w-6 text-[#7A6350]" />
              </div>
            )}
            <div>
              <p className="font-semibold text-[#2B1B0E]">{delivery.store.name}</p>
              <p className="text-sm text-[#7A6350]">{delivery.store.address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${delivery.store.phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EADFD3] py-2.5 text-sm font-medium text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5]"
            >
              <Phone className="h-4 w-4" />
              Call Store
            </a>
            <button
              type="button"
              onClick={() => toast.info("Opening navigation…")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EADFD3] py-2.5 text-sm font-medium text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5]"
            >
              <Navigation className="h-4 w-4" />
              Navigate
            </button>
          </div>
        </div>

        {/* Customer card */}
        <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EDE5]">
              <User className="h-6 w-6 text-[#7A6350]" />
            </div>
            <div>
              <p className="font-semibold text-[#2B1B0E]">{delivery.customer.name}</p>
              <p className="text-sm text-[#7A6350]">{delivery.customer.address}</p>
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <a
              href={`tel:${delivery.customer.phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EADFD3] py-2.5 text-sm font-medium text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5]"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#EADFD3] py-2.5 text-sm font-medium text-[#2B1B0E] transition-colors hover:bg-[#F5EDE5]"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
          </div>
          {delivery.customer.deliveryInstruction && (
            <div className="rounded-xl border border-dashed border-[#D0C4B8] bg-[#FBF6F1] p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#A38F7D]">
                Delivery Instruction
              </p>
              <p className="text-sm italic text-[#5C4A38]">
                "{delivery.customer.deliveryInstruction}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Col 3: Progress + Payment ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Delivery Progress */}
        <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
          <h3 className="mb-5 text-sm font-bold text-[#2B1B0E]">Delivery Progress</h3>
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

        {/* Payment Info */}
        <div className="rounded-2xl border border-[#EADFD3] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[#7A6350]" />
            <h3 className="text-sm font-bold text-[#2B1B0E]">Payment Info</h3>
          </div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#7A6350]">Payment Method</span>
            <span className="font-bold text-[#2B1B0E]">
              {delivery.paymentMethod === "COD" ? "Cash On Delivery" : "Online Payment"}
            </span>
          </div>
          {delivery.paymentMethod === "COD" && (
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-[#7A6350]">Amount To Collect</span>
              <span className="flex items-center font-bold text-[#2B1B0E]">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A5C2E] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#144A25] disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" />
          {loading ? "Confirming…" : "Cash Collected"}
        </button>
        <p className="mt-2 text-center text-xs text-[#A38F7D]">
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
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#EADFD3] py-3 text-sm font-semibold text-[#A38F7D]"
      >
        <CreditCard className="h-4 w-4" />
        Cash Collected
      </button>
      <p className="mt-2 text-center text-xs text-[#A38F7D]">
        Active only after delivery confirmation
      </p>
    </>
  );
}