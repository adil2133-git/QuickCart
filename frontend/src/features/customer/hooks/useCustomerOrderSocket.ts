import { useEffect } from "react";
import { getSocket } from "../../../lib/socket";
import { useOrdersStore } from "../state/myOrdersState";
import type { RawOrderStatus } from "../types/myOrders";

interface OrderStatusChangedPayload {
  orderId: string;
  orderStatus: RawOrderStatus;
  orderNumber: string;
}

interface OrderDriverSearchFailedPayload {
  orderId: string;
  orderNumber: string;
  failed: boolean;
}

export function useCustomerOrderSocket() {
  const liveUpdateStatus = useOrdersStore((s) => s.liveUpdateStatus);
  const liveUpdateDriverSearchFailed = useOrdersStore((s) => s.liveUpdateDriverSearchFailed);

  useEffect(() => {
    const socket = getSocket();

    const handleStatusChanged = (p: OrderStatusChangedPayload) => {
      liveUpdateStatus(p.orderId, p.orderStatus);
      // Toast is shown by useNotifications via notification:new event
      // so we don't double-toast here
    };

    const handleDriverSearchFailed = (p: OrderDriverSearchFailedPayload) => {
      liveUpdateDriverSearchFailed(p.orderId, p.failed);
    };

    socket.on("order:statusChanged", handleStatusChanged);
    socket.on("order:driverSearchFailed", handleDriverSearchFailed);
    return () => {
      socket.off("order:statusChanged", handleStatusChanged);
      socket.off("order:driverSearchFailed", handleDriverSearchFailed);
    };
  }, [liveUpdateStatus, liveUpdateDriverSearchFailed]);
}