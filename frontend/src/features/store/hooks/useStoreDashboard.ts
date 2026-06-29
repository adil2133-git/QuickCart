import { useEffect } from "react";
import api from "../../../api/axios";
import { useDashboardStore } from "../state/dashboardState";
import type { DashboardSummary } from "../types/dashboard";

interface GetDashboardSummaryResponse {
  success: boolean;
  summary: DashboardSummary;
}

export function useStoreDashboard() {
  const { summary, isLoading, error, setLoading, setSummary, setError } = useDashboardStore();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading();
      try {
        const { data } = await api.get<GetDashboardSummaryResponse>("/store/dashboard/summary");
        if (cancelled) return;
        if (!data.success) throw new Error("Failed to load dashboard");
        setSummary(data.summary);
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

  return { summary, isLoading, error };
}