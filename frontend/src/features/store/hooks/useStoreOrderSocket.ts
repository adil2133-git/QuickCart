import { useEffect } from "react";
import { getSocket } from "../../../lib/socket";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import type { StoreOrder } from "../types/storeOrders";

export function useStoreOrderSocket() {
  const orders = useStoreOrdersStore((s) => s.orders);
  const setOrders = useStoreOrdersStore((s) => s.setOrders);
  const updateOrderStatusLocally = useStoreOrdersStore((s) => s.updateOrderStatusLocally);

  useEffect(() => {
    const socket = getSocket();

    const handleNewOrder = (incoming: StoreOrder) => {
      // Prepend so it shows at the top of the table immediately, like a
      // live feed — re-fetching on every event would defeat the purpose.
      setOrders([incoming, ...orders]);
    };

    const handleStatusChanged = (payload: { orderId: string; orderStatus: StoreOrder["orderStatus"] }) => {
      updateOrderStatusLocally(payload.orderId, payload.orderStatus);
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:statusChanged", handleStatusChanged);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:statusChanged", handleStatusChanged);
    };
  }, [orders, setOrders, updateOrderStatusLocally]);
}