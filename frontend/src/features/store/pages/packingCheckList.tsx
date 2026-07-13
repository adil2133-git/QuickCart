import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Package } from "lucide-react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import { useFetchOrderDetail, useUpdateOrderStatus } from "../hooks/useStoreOrders";
import { useOrderCancelledWatcher } from "../hooks/useOrderCancelledWatcher";
import { OrderCancelledModal } from "../components/orderCancelledModal";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PackingChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchDetail = useFetchOrderDetail();
  const updateStatus = useUpdateOrderStatus();

  const {
    selectedOrder,
    isLoadingDetail,
    packingItems,
    togglePackingItem,
    markAllPacked,
    isUpdatingStatus,
  } = useStoreOrdersStore();

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  // Live-detect the customer cancelling this exact order mid-pack.
  const { justCancelled, dismiss } = useOrderCancelledWatcher(selectedOrder?.orderStatus);

  const packedCount = packingItems.filter((i) => i.isPacked).length;
  const totalCount = packingItems.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
  const allPacked = packedCount === totalCount && totalCount > 0;

  const handleReadyForPickup = async () => {
    if (!selectedOrder) return;
    const ok = await updateStatus(selectedOrder.id, "READY_FOR_PICKUP");
    if (ok) navigate(`/store/orders/${selectedOrder.id}/complete`);
  };

  if (isLoadingDetail) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FBF1E9] font-['Inter',sans-serif]">
        <p className="text-sm text-[#A38F7D]">Loading checklist…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#FBF1E9] font-['Inter',sans-serif]">
      {justCancelled && selectedOrder && (
        <OrderCancelledModal
          orderNumber={selectedOrder.orderNumber}
          onAcknowledge={() => {
            dismiss();
            navigate("/store/orders");
          }}
        />
      )}

      {/* ── Progress bar card ──────────────────────────────────────────────────── */}
      <div className="m-8 mb-0 rounded-2xl border border-[#EADFD3] bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#2B1B0E]">Order Progress</p>
            <p className="mt-0.5 text-xs text-[#A38F7D]">Scanning items for customer shipment</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#2B1B0E]">{progressPercent}%</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C8A37E]">
              {packedCount}/{totalCount} Packed
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F5EDE3]">
          <div
            className="h-full rounded-full bg-[#2B1B0E] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Items grid ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8 pt-5">
        {packingItems.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#A38F7D]">
            No items found for this order.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {packingItems.map((item) => (
              <button
                key={item.productId}
                onClick={() => togglePackingItem(item.productId)}
                className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all ${
                  item.isPacked
                    ? "border-[#2B1B0E]"
                    : "border-[#EADFD3] hover:border-[#C8A37E]"
                }`}
              >
                {/* Product image */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#F5EDE3]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-12 w-12 text-[#C8A37E]" />
                    </div>
                  )}

                  {/* Check overlay */}
                  <div
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      item.isPacked
                        ? "border-[#2B1B0E] bg-[#2B1B0E]"
                        : "border-white bg-white/60"
                    }`}
                  >
                    {item.isPacked && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>

                {/* Item info */}
                <div
                  className={`px-4 py-3 transition-colors ${
                    item.isPacked ? "bg-[#F5EDE3]" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#2B1B0E]">{item.productName}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.isPacked
                          ? "bg-[#2B1B0E] text-white"
                          : "bg-[#F5EDE3] text-[#7A6352]"
                      }`}
                    >
                      {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs italic text-[#A38F7D]">{item.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-[#EADFD3] bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-[#7A6352]">
            <div className="flex items-center gap-1.5">
              {/* Truck + person icon placeholder */}
              <span className="text-lg">🚚</span>
              <span className="text-lg">👤</span>
            </div>
            <span className="font-medium">Scheduled for pickup at 4:30 PM</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={markAllPacked}
              disabled={allPacked || selectedOrder?.orderStatus === "CANCELLED"}
              className="rounded-full border border-[#EADFD3] px-6 py-2.5 text-sm font-medium text-[#5C4A37] transition-colors hover:bg-[#FBF1E9] disabled:opacity-40"
            >
              Mark All Packed
            </button>

            <button
              onClick={handleReadyForPickup}
              disabled={!allPacked || isUpdatingStatus || selectedOrder?.orderStatus === "CANCELLED"}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                allPacked
                  ? "bg-[#2B1B0E] text-white hover:opacity-90"
                  : "cursor-not-allowed bg-[#C8A37E]/50 text-[#2B1B0E]/50"
              }`}
            >
              Ready for Pickup
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}