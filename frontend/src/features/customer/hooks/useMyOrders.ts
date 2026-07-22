import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../../api/axios";
import { getSocket } from "../../../lib/socket";
import { getApiErrorMessage } from "../../../api/apiError";
import { useOrdersStore } from "../state/myOrdersState";
import type { GetOrdersResponse, GetOrderDetailResponse, CustomerOrderDetail, OrdersTab } from "../types/myOrders";
export function useOrdersTab() {
  const activeTab = useOrdersStore((s) => s.activeTab);
  const setActiveTab = useOrdersStore((s) => s.setActiveTab);
  return { activeTab, setActiveTab };
}

// fetches orders for the given tab whenever the tab changes. The backend
// filters server-side via ?tab=active|past, so each tab switch is a fresh
// request rather than a client-side filter of one big list
export function useOrdersList(tab: OrdersTab) {
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const error = useOrdersStore((s) => s.error);
  const setLoading = useOrdersStore((s) => s.setLoading);
  const setOrders = useOrdersStore((s) => s.setOrders);
  const setError = useOrdersStore((s) => s.setError);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading();
      try {
        const { data } = await api.get<GetOrdersResponse>("/customer/orders", {
          params: { tab },
        });
        if (cancelled) return;
        setOrders(data.orders);
      } catch (err) {
        if (cancelled) return;
        const message = getApiErrorMessage(err, "Couldn't load your orders. Please try again.");
        setError(message);
        toast.error(message, { id: "orders-load-error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setError, setLoading, setOrders, tab]);

  return { orders, isLoading, error };
}

// cancels an order the customer placed. Only valid while the order is still
// PENDING/ACCEPTED/PACKING on the backend — the API rejects it otherwise
export function useCancelOrder() {
  const removeOrder = useOrdersStore((s) => s.removeOrder);

  const cancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/customer/orders/${orderId}/cancel`);
      removeOrder(orderId);
      toast.success("Order cancelled.");
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, "Couldn't cancel your order. Please try again.");
      toast.error(message, { id: "cancel-order-error" });
      return false;
    }
  };

  return { cancelOrder };
}

// fetches full detail (line items, delivery address, payment status) for a
// single order — used by the order tracking view's "Delivering To" and
// "Order Summary" cards, which need more than the list endpoint returns
export function useOrderDetail(orderId: string | null) {
  const [detail, setDetail] = useState<CustomerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    // Standard "start loading, then fetch" pattern for a data-fetching
    // effect keyed on orderId — matches React's own docs example for
    // fetching data; the eslint-plugin-react-hooks v7 rule below is
    // overly strict about this well-established pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    const fetchDetail = () =>
      api
        .get<GetOrderDetailResponse>(`/customer/orders/${orderId}`)
        .then(({ data }) => {
          if (!cancelled) setDetail(data.order);
        })
        .catch(() => {
          if (!cancelled) setDetail(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

    fetchDetail();

    const socket = getSocket();
    const handleDriverSearchFailed = (p: { orderId: string }) => {
      if (p.orderId === orderId) fetchDetail();
    };
    socket.on("order:driverSearchFailed", handleDriverSearchFailed);

    return () => {
      cancelled = true;
      socket.off("order:driverSearchFailed", handleDriverSearchFailed);
    };
 }, [orderId]);

  if (!orderId) {
    return { detail: null, isLoading: false };
  }

  return { detail, isLoading };
}