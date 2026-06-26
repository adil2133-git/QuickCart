import { useCallback } from "react";
import { useStoreOrdersStore } from "../state/storeOrdersState";
import type {
  GetStoreOrdersResponse,
  GetStoreOrderDetailResponse,
  UpdateOrderStatusResponse,
  PackingItem,
  OrderStatus,
} from "../types/storeOrders";
import api from "../../../api/axios";

const BASE = "/store";

export function useFetchStoreOrders() {
  const { setLoadingOrders, setOrders, setOrdersError, setPagination } = useStoreOrdersStore();

  return useCallback(
    async (params: { tab?: string; search?: string; page?: number; limit?: number } = {}) => {
      setLoadingOrders();
      try {
        const { data } = await api.get<GetStoreOrdersResponse>(`${BASE}/orders`, {
          params: {
            tab:    params.tab    ?? "ALL",
            search: params.search ?? "",
            page:   params.page   ?? 1,
            limit:  params.limit  ?? 10,
          },
        });
        if (!data.success) throw new Error("Failed to fetch orders");
        setOrders(data.orders);
        if (data.pagination) setPagination(data.pagination);
      } catch (err) {
        setOrdersError(err instanceof Error ? err.message : "Failed to load orders");
      }
    },
    [setLoadingOrders, setOrders, setOrdersError, setPagination]
  );
}

export function useFetchOrderDetail() {
  const { setLoadingDetail, setSelectedOrder, setDetailError, setPackingItems } =
    useStoreOrdersStore();

  return useCallback(
    async (orderId: string) => {
      setLoadingDetail();
      try {
        const { data } = await api.get<GetStoreOrderDetailResponse>(`${BASE}/orders/${orderId}`);
        if (!data.success) throw new Error("Order not found");
        setSelectedOrder(data.order);
        const items: PackingItem[] = (data.order.products ?? []).map((p) => ({
          productId:   p.productId,
          productName: p.productName,
          quantity:    p.quantity,
          image:       p.image ?? null,
          isPacked:    false,
        }));
        setPackingItems(items);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Failed to load order");
      }
    },
    [setLoadingDetail, setSelectedOrder, setDetailError, setPackingItems]
  );
}

export function useUpdateOrderStatus() {
  const { setUpdatingStatus, updateOrderStatusLocally } = useStoreOrdersStore();

  return useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      setUpdatingStatus(true);
      try {
        const { data } = await api.patch<UpdateOrderStatusResponse>(
          `${BASE}/orders/${orderId}/status`,
          { status }
        );
        if (!data.success) throw new Error(data.message ?? "Update failed");
        updateOrderStatusLocally(orderId, status);
        return true;
      } catch (err) {
        console.error("Status update error:", err);
        return false;
      } finally {
        setUpdatingStatus(false);
      }
    },
    [setUpdatingStatus, updateOrderStatusLocally]
  );
}