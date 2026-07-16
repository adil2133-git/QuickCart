import { create } from "zustand";
import type { DriverRewardsSummary } from "../types/driverRewards";

interface DriverRewardsState {
  summary: DriverRewardsSummary | null;
  isLoading: boolean;
  error: string | null;

  setSummary: (summary: DriverRewardsSummary) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
}

export const useDriverRewardsStore = create<DriverRewardsState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));