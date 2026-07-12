import { useEffect } from "react";
import { getSocket } from "../../../lib/socket";
import { useDashboardStore } from "../state/dashboardState";

interface IncomingOrderPayload {
  id: string;
  orderNumber: string;
  recipientName: string;
  totalAmount: number;
  orderStatus: "PENDING" | "ACCEPTED" | "PACKING" | "READY_FOR_PICKUP" | "DRIVER_ASSIGNED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
}

export function useStoreDashboardSocket() {
  const addIncomingOrder = useDashboardStore((s) => s.addIncomingOrder);
  const applyOrderStatusChange = useDashboardStore((s) => s.applyOrderStatusChange);

  useEffect(() => {
    const socket = getSocket();

    const handleNewOrder = (incoming: IncomingOrderPayload) => {
      addIncomingOrder({
        _id: incoming.id,
        orderNumber: incoming.orderNumber,
        customerName: incoming.recipientName,
        totalAmount: incoming.totalAmount,
        orderStatus: incoming.orderStatus,
      });
    };

    const handleStatusChanged = (payload: { orderId: string; orderStatus: IncomingOrderPayload["orderStatus"] }) => {
      applyOrderStatusChange(payload.orderId, payload.orderStatus);
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:statusChanged", handleStatusChanged);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:statusChanged", handleStatusChanged);
    };
  }, [addIncomingOrder, applyOrderStatusChange]);
}