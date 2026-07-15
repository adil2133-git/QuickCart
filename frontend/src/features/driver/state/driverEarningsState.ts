import { create } from "zustand";
import type { DriverEarningsSummary } from "../types/driverEarnings";

interface DriverEarningsState {
  summary: DriverEarningsSummary | null;
  isLoading: boolean;
  error: string | null;

  setSummary: (summary: DriverEarningsSummary) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
}

export const useDriverEarningsStore = create<DriverEarningsState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
