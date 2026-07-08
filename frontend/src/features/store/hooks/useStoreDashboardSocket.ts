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

    socket.on("order:new", handleNewOrder);

    return () => {
      socket.off("order:new", handleNewOrder);
    };
  }, [addIncomingOrder]);
}