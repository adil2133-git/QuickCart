import { create } from "zustand";
import type { DashboardSummary } from "../types/dashboard";

interface DashboardState {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  setLoading: () => void;
  setData: (data: DashboardSummary) => void;
  setError: (message: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  setLoading: () => set({ isLoading: true, error: null }),
  setData: (data) => set({ data, isLoading: false, error: null }),
  setError: (message) => set({ error: message, isLoading: false }),
}));