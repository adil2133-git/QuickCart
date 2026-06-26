// src/features/driver/hooks/useDriverDashboard.ts
import { useEffect, useCallback } from "react";
import { useDriverDashboardStore } from "../state/driverDashboarState";
import api from "../../../api/axios";

export function useDriverDashboard() {
  const {
    online,
    orders,
    overviewCards,
    activityItems,
    isLoading,
    error,
    setOnline,
    removeOrder,
    setOrders,
    setOverviewCards,
    setActivityItems,
    setLoading,
    setError,
  } = useDriverDashboardStore();

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
  }, [fetchDashboard]);

  // ── Toggle online/offline status ───────────────────────────────────────────
  // TODO: wire to PATCH /driver/status when backend is ready
  const toggleOnline = useCallback(async () => {
    const next = !online;
    setOnline(next);
    try {
      await api.patch("/driver/status", { online: next });
    } catch {
      // Rollback if the server call fails
      setOnline(!next);
    }
  }, [online, setOnline]);

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
    online,
    orders,
    overviewCards,
    activityItems,
    isLoading,
    error,
    toggleOnline,
    acceptOrder,
    declineOrder,
  };
}