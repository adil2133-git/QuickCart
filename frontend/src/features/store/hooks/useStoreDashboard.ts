import { useEffect } from "react";
import api from "../../../api/axios";
import { useDashboardStore } from "../state/dashboardState";
import type { GetDashboardSummaryResponse } from "../types/dashboard";

export function useStoreDashboard() {
  const { data, isLoading, error, setLoading, setData, setError } = useDashboardStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading();
      try {
        const { data: res } = await api.get<GetDashboardSummaryResponse>(
          "/store/dashboard/summary"
        );
        if (cancelled) return;
        if (!res.success) throw new Error("Failed to load dashboard");
        setData({
          store: res.store,
          kpis: res.kpis,
          incomingOrders: res.incomingOrders,
          bestSelling: res.bestSelling,
          lowStockProducts: res.lowStockProducts,
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          (err as any)?.response?.data?.message ?? "Couldn't load your dashboard. Please try again.";
        setError(message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}