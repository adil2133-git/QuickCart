import { create } from "zustand";
import type { DashboardSummary } from "../types/dashboard";

interface DashboardState {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  setLoading: () => void;
  setSummary: (summary: DashboardSummary) => void;
  setError: (message: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  setLoading: () => set({ isLoading: true, error: null }),
  setSummary: (summary) => set({ summary, isLoading: false, error: null }),
  setError: (message) => set({ error: message, isLoading: false }),
}));