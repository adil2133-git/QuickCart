import { useEffect } from "react";
import { toast } from "sonner";
import api from "../../../api/axios"; // adjust to your real path, e.g. "../../../api/axiosInstance"
import { useOrdersStore } from "../state/myOrdersState";
import type { GetOrdersResponse, OrdersTab } from "../types/myOrders";

export function useOrdersTab() {
  const activeTab = useOrdersStore((s) => s.activeTab);
  const setActiveTab = useOrdersStore((s) => s.setActiveTab);
  return { activeTab, setActiveTab };
}

// Fetches orders for the given tab whenever the tab changes. The backend
// filters server-side via ?tab=active|past, so each tab switch is a fresh
// request rather than a client-side filter of one big list.
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
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Couldn't load your orders. Please try again.";
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

// Cancels an order the customer placed. Only valid while the order is still
// PENDING/ACCEPTED/PACKING on the backend — the API rejects it otherwise.
export function useCancelOrder() {
  const removeOrder = useOrdersStore((s) => s.removeOrder);

  const cancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/customer/orders/${orderId}/cancel`);
      removeOrder(orderId);
      toast.success("Order cancelled.");
      return true;
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Couldn't cancel your order. Please try again.";
      toast.error(message, { id: "cancel-order-error" });
      return false;
    }
  };

  return { cancelOrder };
}