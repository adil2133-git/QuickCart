import { useEffect, useCallback } from "react";
import { useDriverDashboardStore } from "../state/driverDashboarState";
import { useDriverDeliveryStore } from "../state/driverDeliveryState";
import { useDriverDeliveryActions } from "./useDriverDelivery";
import api from "../../../api/axios";

export function useDriverDashboard() {
  const {
    orders,
    overviewCards,
    activityItems,
    isLoading,
    error,
    removeOrder,
    setOrders,
    setOverviewCards,
    setActivityItems,
    setLoading,
    setError,
  } = useDriverDashboardStore();

  // Online status comes from the SAME store DriverTopbar reads — single source of truth.
  const isOnline = useDriverDeliveryStore((s) => s.isOnline);
  const { toggleAvailability, fetchAvailability } = useDriverDeliveryActions();

  // ── Fetch all dashboard data on mount ──────────────────────────────────────
  // TODO: replace these endpoint paths with your real backend routes
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, overviewRes, activityRes] = await Promise.all([
        api.get("/driver/orders/pending"),
        api.get("/driver/overview"),
        api.get("/driver/activity"),
      ]);
      setOrders(ordersRes.data.orders);
      setOverviewCards(overviewRes.data.cards);
      setActivityItems(activityRes.data.activity);
    } catch {
      // Fallback data from the store is already shown — just flag the error
      setError("Could not load latest data. Showing last known state.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setOrders, setOverviewCards, setActivityItems]);

  useEffect(() => {
    fetchDashboard();
    fetchAvailability(); // hydrate real isOnline from the DB on every load/refresh
  }, [fetchDashboard, fetchAvailability]);

  // ── Toggle online/offline status ───────────────────────────────────────────
  // Delegates to the shared delivery-store action (same one the topbar uses),
  // so the topbar badge and dashboard button update together automatically.
  const toggleOnline = useCallback(async () => {
    try {
      await toggleAvailability(!isOnline);
    } catch {
      setError("Could not update availability. Try again.");
    }
  }, [isOnline, toggleAvailability, setError]);

  // ── Accept order ───────────────────────────────────────────────────────────
  // TODO: wire to POST /driver/orders/:id/accept
  const acceptOrder = useCallback(async (id: string) => {
    try {
      await api.post(`/driver/orders/${id}/accept`);
      removeOrder(id);
    } catch {
      setError("Failed to accept order. Please try again.");
    }
  }, [removeOrder, setError]);

  // ── Decline order ──────────────────────────────────────────────────────────
  // TODO: wire to POST /driver/orders/:id/decline
  const declineOrder = useCallback(async (id: string) => {
    try {
      await api.post(`/driver/orders/${id}/decline`);
      removeOrder(id);
    } catch {
      setError("Failed to decline order. Please try again.");
    }
  }, [removeOrder, setError]);

  return {
    orders,
    overviewCards,
    activityItems,
    isLoading,
    error,
    isOnline,
    toggleOnline,
    acceptOrder,
    declineOrder,
  };
}