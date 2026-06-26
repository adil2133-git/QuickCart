import { Phone } from "lucide-react";
import NavBar from "../components/navbar";
import { useOrdersList, useOrdersTab } from "../hooks/useMyOrders";
import type { CustomerOrder, OrderStatus } from "../types/myOrders";
import { stageIndexForStatus } from "../types/myOrders";

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<OrderStatus, string> = {
  PROCESSING: "Processing",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function StatusPill({ status }: { status: OrderStatus }) {
  const isCancelled = status === "CANCELLED";

  const classes = isCancelled
    ? "bg-[#F5E6E0] text-[#9C4A3A]"
    : "bg-[#F5EBE0] text-[#6B4226]";

  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${classes}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Progress tracker ─────────────────────────────────────────────────────────

function ProgressTracker({ order }: { order: CustomerOrder }) {
  const reachedIndex = stageIndexForStatus(order.status);
  const isComplete = order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED";
  const barColor = order.status === "CANCELLED" ? "bg-[#D8B9A8]" : isComplete ? "bg-[#3A6B35]" : "bg-[#6B4226]";
  const labelColor = order.status === "CANCELLED" ? "text-[#9C7E5F]" : isComplete ? "text-[#3A6B35]" : "text-[#6B4226]";

  const stages = [
    { key: "PROCESSING", label: "Processing" },
    { key: "PACKED", label: "Packed" },
    { key: "DELIVERY", label: "Delivery" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-[#3D2B1F]">Order Progress</span>
        <span className={`text-sm font-bold ${labelColor}`}>{order.progressPercent}%</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex-1 h-1.5 rounded-full bg-[#EDE0D4] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${i <= reachedIndex ? barColor : ""}`}
              style={{ width: i <= reachedIndex ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {stages.map((stage, i) => (
          <span
            key={stage.key}
            className={`text-[11px] font-semibold tracking-wide uppercase ${
              i <= reachedIndex ? labelColor : "text-[#B89A7A]"
            }`}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: CustomerOrder }) {
  const extraCount = order.itemCount - order.previewItems.length;
  const isPast = order.status === "DELIVERED" || order.status === "CANCELLED";
  const showCallRider = order.status === "OUT_FOR_DELIVERY";

  const formattedDate = new Date(order.placedAt).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E8D8C8] p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A1108]" style={{ fontFamily: "Georgia, serif" }}>
            {order.storeName}
          </h3>
          <p className="text-xs text-[#9C7E5F] mt-1 font-mono">
            #{order.orderNumber} · {formattedDate}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F5EBE0] shrink-0 flex items-center justify-center">
          {order.previewItems[0]?.image ? (
            <img
              src={order.previewItems[0].image}
              alt={order.previewItems[0].name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">🛒</span>
          )}
          {extraCount > 0 && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">+{extraCount}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-base text-[#1A1108]">{order.itemSummary}</p>
          <p className="text-sm text-[#9C7E5F]">{order.itemCount} items total</p>
        </div>
      </div>

      {!isPast && (
        <div className="mb-5">
          <ProgressTracker order={order} />
        </div>
      )}

      <div className="border-t border-[#EDE0D4] pt-4 mt-auto flex items-center justify-between">
        <span className="text-xl font-bold text-[#1A1108]" style={{ fontFamily: "Georgia, serif" }}>
          ₹{order.totalAmount.toFixed(2)}
        </span>

        {isPast ? (
          <button className="text-sm font-semibold text-[#6B4226] hover:underline">
            View Details
          </button>
        ) : showCallRider ? (
          <button className="flex items-center gap-2 bg-[#6B4226] hover:bg-[#5A3520] text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors">
            <Phone size={14} />
            Call Rider
          </button>
        ) : (
          <button className="text-sm font-semibold text-[#6B4226] hover:underline">
            Track Order
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const { activeTab, setActiveTab } = useOrdersTab();
  const { orders, isLoading, error } = useOrdersList(activeTab);

  return (
    <div className="min-h-screen bg-[#FBF3E8]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1
          className="text-4xl font-bold text-[#1A1108] mb-2"
          style={{ fontFamily: "Georgia, serif" }}
        >
          My Orders
        </h1>
        <p className="text-[#9C7E5F] mb-8">Track and manage your recent marketplace purchases</p>

        <div className="flex items-center gap-8 border-b border-[#E8D8C8] mb-8">
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 text-lg font-semibold relative -mb-px ${
              activeTab === "active" ? "text-[#1A1108]" : "text-[#B89A7A]"
            }`}
            style={{ fontFamily: "Georgia, serif" }}
          >
            Active Orders
            {activeTab === "active" && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#6B4226] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`pb-3 text-lg font-semibold relative -mb-px ${
              activeTab === "past" ? "text-[#1A1108]" : "text-[#B89A7A]"
            }`}
            style={{ fontFamily: "Georgia, serif" }}
          >
            Past Orders
            {activeTab === "past" && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#6B4226] rounded-full" />
            )}
          </button>
        </div>

        {isLoading ? (
          <p className="text-center text-[#9C7E5F] py-16">Loading your orders…</p>
        ) : error ? (
          <p className="text-center text-[#9C7E5F] py-16">{error}</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#9C7E5F]">
              {activeTab === "active" ? "No active orders right now." : "No past orders yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}