import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import {
  useFetchOrderDetail,
  useUpdateOrderStatus,
  useRetryDriverSearch,
  useCancelUndeliverableOrder,
} from "../hooks/useStoreOrders";
import { useOrderCancelledWatcher } from "../hooks/useOrderCancelledWatcher";
import { OrderCancelledModal } from "../components/orderCancelledModal";
import type { OrderStatus } from "../types/storeOrders";

// ─── Order progress steps ─────────────────────────────────────────────────────

type ProgressStep = {
  key: OrderStatus;
  label: string;
};

const PROGRESS_STEPS: ProgressStep[] = [
  { key: "PENDING", label: "Received" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PACKING", label: "Packing" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
];

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function getStepState(stepKey: OrderStatus, currentStatus: OrderStatus): "done" | "active" | "idle" {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "idle";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIcon({ state }: { state: "done" | "active" | "idle" }) {
  if (state === "done") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B1B0E]">
        <CheckCircle2 className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#2B1B0E] bg-white">
        <div className="h-3 w-3 rounded-full bg-[#2B1B0E]" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#EADFD3] bg-white">
      <Circle className="h-4 w-4 text-[#C8A37E]" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
 const fetchDetail = useFetchOrderDetail();
  const updateStatus = useUpdateOrderStatus();
  const retryDriverSearch = useRetryDriverSearch();
  const cancelUndeliverableOrder = useCancelUndeliverableOrder();

  const { selectedOrder, isLoadingDetail, detailError, isUpdatingStatus } =
    useStoreOrdersStore();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  const order = selectedOrder;

  // Live-detect the customer cancelling this exact order while it's open here.
  const { justCancelled, dismiss } = useOrderCancelledWatcher(order?.orderStatus);

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleStartPacking = async () => {
    if (!order) return;
    const ok = await updateStatus(order.id, "PACKING");
    if (ok) navigate(`/store/orders/${order.id}/packing`);
  };

   const handleMarkReady = async () => {
    if (!order) return;
    const ok = await updateStatus(order.id, "READY_FOR_PICKUP");
    if (ok) navigate(`/store/orders/${order.id}/complete`);
  };

  const handleRetryDriverSearch = async () => {
    if (!order) return;
    await retryDriverSearch(order.id);
  };

  const handleCancelUndeliverable = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      `Cancel order #${order.orderNumber}? The customer will be refunded in full and notified.`
    );
    if (!confirmed) return;
    const ok = await cancelUndeliverableOrder(order.id);
    if (ok) navigate("/store/orders");
  };

  // ── Loading / error states ────────────────────────────────────────────────────
  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FBF1E9] font-['Inter',sans-serif]">
        <p className="text-sm text-[#A38F7D]">Loading order…</p>
      </div>
    );
  }

  if (detailError || !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#FBF1E9] font-['Inter',sans-serif]">
        <p className="text-sm text-red-500">{detailError ?? "Order not found"}</p>
        <button
          onClick={() => navigate("/store/orders")}
          className="rounded-xl bg-[#2B1B0E] px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FBF1E9] font-['Inter',sans-serif]">
      {justCancelled && (
        <OrderCancelledModal
          orderNumber={order.orderNumber}
          onAcknowledge={() => {
            dismiss();
            navigate("/store/orders");
          }}
        />
      )}

      {/* ── Progress tracker ───────────────────────────────────────────────────── */}
      <div className="border-b border-[#EADFD3] bg-white px-8 py-5">
        <div className="flex items-center">
          {PROGRESS_STEPS.map((step, idx) => {
            const state = getStepState(step.key, order.orderStatus);
            const isLast = idx === PROGRESS_STEPS.length - 1;
            return (
              <div key={step.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* Left connector */}
                  {idx > 0 && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        getStepState(PROGRESS_STEPS[idx - 1].key, order.orderStatus) === "done"
                          ? "bg-[#2B1B0E]"
                          : "bg-[#EADFD3]"
                      }`}
                    />
                  )}
                  <StepIcon state={state} />
                  {/* Right connector */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        state === "done" ? "bg-[#2B1B0E]" : "bg-[#EADFD3]"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    state === "idle" ? "text-[#A38F7D]" : "text-[#2B1B0E]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── No drivers found banner ───────────────────────────────────────────── */}
      {order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed && (
        <div className="mx-8 mt-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                No drivers were found for this order
              </p>
              <p className="mt-1 text-sm text-amber-700">
                We searched nearby drivers repeatedly with no luck. You can try
                the search again, or cancel the order with a full refund to the
                customer.
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={handleRetryDriverSearch}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full bg-[#2B1B0E] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Retry Driver Search
            </button>
            <button
              onClick={handleCancelUndeliverable}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Cancel & Refund
            </button>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-6 overflow-y-auto p-8">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Customer card */}
          <div className="rounded-2xl border border-[#EADFD3] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2B1B0E]">{order.recipientName}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-[#7A6352]">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Home Delivery
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#EADFD3] pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#A38F7D]">
                  Placed On
                </p>
                <p className="mt-1 text-sm font-medium text-[#2B1B0E]">
                  {formatDateTime(order.placedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#A38F7D]">
                  Payment Method
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#7A6352]" />
                  <p className="text-sm font-medium text-[#2B1B0E]">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="rounded-2xl border border-[#EADFD3] bg-white">
            <div className="border-b border-[#EADFD3] px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#A38F7D]">
                Order Items
              </p>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[#F5EDE3] px-6 py-2">
              {["PRODUCT", "PRICE", "QTY", "TOTAL"].map((h) => (
                <span key={h} className="text-xs font-semibold tracking-wider text-[#A38F7D]">
                  {h}
                </span>
              ))}
            </div>

            {order.products.map((item, idx) => (
              <div
                key={item.productId}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-4 ${
                  idx !== order.products.length - 1 ? "border-b border-[#F5EDE3]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5EDE3]">
                      <Package className="h-5 w-5 text-[#C8A37E]" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#2B1B0E]">{item.productName}</span>
                </div>
                <span className="text-sm text-[#7A6352]">₹{item.price.toFixed(2)}</span>
                <span className="text-sm text-[#7A6352]">{item.quantity}x</span>
                <span className="text-sm font-semibold text-[#2B1B0E]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — Order summary */}
        <div className="w-72 flex-shrink-0">
          <div className="rounded-2xl border border-[#EADFD3] bg-white p-6">
            <h3 className="text-base font-bold text-[#2B1B0E]">Order Summary</h3>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7A6352]">Subtotal</span>
                <span className="font-medium text-[#2B1B0E]">₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A6352]">Delivery Fee</span>
                <span className="font-medium text-[#2B1B0E]">
                  ₹{order.deliveryCharge.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-[#EADFD3] pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-[#2B1B0E]">Total</span>
                  <span className="text-base font-bold text-[#2B1B0E]">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-[#EADFD3] bg-white px-8 py-4">
         <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-sm font-semibold text-[#2B1B0E]">
            CURRENTLY:{" "}
            {order.orderStatus === "READY_FOR_PICKUP" && order.driverSearchFailed
              ? "NO DRIVERS FOUND"
              : order.orderStatus.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-[#EADFD3] px-6 py-2.5 text-sm font-medium text-[#5C4A37] transition-colors hover:bg-[#FBF1E9]">
            Contact Customer
          </button>

          {order.orderStatus === "ACCEPTED" && (
            <button
              onClick={handleStartPacking}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full bg-[#C8A37E] px-6 py-2.5 text-sm font-semibold text-[#2B1B0E] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              Start Packing
            </button>
          )}

          {order.orderStatus === "PACKING" && (
            <button
              onClick={handleMarkReady}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full bg-[#2B1B0E] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              Mark Ready for Pickup
            </button>
          )}

          {order.orderStatus === "PENDING" && (
            <button
              onClick={() => updateStatus(order.id, "ACCEPTED")}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 rounded-full bg-[#2B1B0E] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}