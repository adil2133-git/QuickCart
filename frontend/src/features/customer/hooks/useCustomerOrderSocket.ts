import { useEffect } from "react";
import { getSocket } from "../../../lib/socket";
import { useOrdersStore } from "../state/myOrdersState";
import type { RawOrderStatus } from "../types/myOrders";

interface OrderStatusChangedPayload {
  orderId: string;
  orderStatus: RawOrderStatus;
  orderNumber: string;
}

export function useCustomerOrderSocket() {
  const liveUpdateStatus = useOrdersStore((s) => s.liveUpdateStatus);

  useEffect(() => {
    const socket = getSocket();

    const handle = (p: OrderStatusChangedPayload) => {
      liveUpdateStatus(p.orderId, p.orderStatus);
      // Toast is shown by useNotifications via notification:new event
      // so we don't double-toast here
    };

    socket.on("order:statusChanged", handle);
    return () => { socket.off("order:statusChanged", handle); };
  }, [liveUpdateStatus]);
}