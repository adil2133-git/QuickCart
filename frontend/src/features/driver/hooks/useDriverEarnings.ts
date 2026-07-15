import { useCallback } from "react";
import api from "../../../api/axios";
import { useDriverEarningsStore } from "../state/driverEarningsState";
import type { GetEarningsSummaryResponse } from "../types/driverEarnings";

export function useDriverEarningsActions() {
  // Same reasoning as useDriverDeliveryActions: read via getState() (no
  // subscription) so this callback's identity stays stable across renders.
  const store = useDriverEarningsStore.getState;

  const fetchEarningsSummary = useCallback(async () => {
    store().setLoading(true);
    store().setError(null);
    try {
      const { data } = await api.get<GetEarningsSummaryResponse>("/driver/earnings");
      store().setSummary(data.earnings);
    } catch {
      store().setError("Failed to load earnings.");
    } finally {
      store().setLoading(false);
    }
  }, [store]);

  return { fetchEarningsSummary };
}
