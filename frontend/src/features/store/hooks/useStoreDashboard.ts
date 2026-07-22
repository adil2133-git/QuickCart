import { useEffect } from "react";
import api from "../../../api/axios";
import { getApiErrorMessage as getErrorMessage } from "../../../api/apiError";
import { useDashboardStore } from "../state/dashboardState";
import type { DashboardSummary, StoreStatus } from "../types/dashboard";

interface GetDashboardSummaryResponse {
  success: boolean;
  summary: DashboardSummary;
}

interface UpdateStoreStatusResponse {
  success: boolean;
  status: StoreStatus;
}

export function useStoreDashboard() {
  const { summary, isLoading, error, setLoading, setSummary, setError, setStatus } =
    useDashboardStore();

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
        const message = getErrorMessage(err, "Couldn't load your dashboard. Please try again.");
        setError(message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setError, setLoading, setStatus, setSummary]);

  // Optimistically applies the new status, then confirms with the server.
  // Rolls back to the previous status if the request fails.
  const updateStatus = async (status: StoreStatus) => {
    const previous = summary?.status;
    if (previous === status) return;

    setStatus(status);
    try {
      const { data } = await api.patch<UpdateStoreStatusResponse>("/store/status", { status });
      if (data.success) setStatus(data.status);
    } catch {
      if (previous) setStatus(previous);
    }
  };

  return { summary, isLoading, error, updateStatus };
}