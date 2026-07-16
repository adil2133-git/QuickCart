import { useCallback } from "react";
import api from "../../../api/axios";
import { useDriverRewardsStore } from "../state/driverRewardsState";
import type { GetRewardsSummaryResponse } from "../types/driverRewards";

export function useDriverRewardsActions() {
  const store = useDriverRewardsStore.getState;

  const fetchRewardsSummary = useCallback(async () => {
    store().setLoading(true);
    store().setError(null);
    try {
      const { data } = await api.get<GetRewardsSummaryResponse>("/driver/rewards");
      store().setSummary(data.rewards);
    } catch {
      store().setError("Failed to load rewards.");
    } finally {
      store().setLoading(false);
    }
  }, [store]);

  return { fetchRewardsSummary };
}
