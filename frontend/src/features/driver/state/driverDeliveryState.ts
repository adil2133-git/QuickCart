import { create } from "zustand";
import type {
  DeliveryRequest,
  ActiveDelivery,
  CompletedDelivery,
  DriverTodayStats,
  DeliveryStage,
} from "../types/driverDelivery";

// ─── Tab ─────────────────────────────────────────────────────────────────────

export type DeliveryTab = "NEW_REQUESTS" | "ACTIVE_DELIVERY" | "COMPLETED_HISTORY";

// ─── State shape ──────────────────────────────────────────────────────────────

interface DriverDeliveryState {
  // Tab
  activeTab: DeliveryTab;
  setActiveTab: (tab: DeliveryTab) => void;

  // New Requests
  requests: DeliveryRequest[];
  requestsLoading: boolean;
  requestsError: string | null;
  setRequests: (r: DeliveryRequest[]) => void;
  setRequestsLoading: (v: boolean) => void;
  setRequestsError: (e: string | null) => void;
  removeRequest: (requestId: string) => void;

  // Active Delivery
  activeDelivery: ActiveDelivery | null;
  activeLoading: boolean;
  activeError: string | null;
  setActiveDelivery: (d: ActiveDelivery | null) => void;
  setActiveLoading: (v: boolean) => void;
  setActiveError: (e: string | null) => void;
  advanceStage: (newStage: DeliveryStage, completedAt: string) => void;
  markCashCollected: () => void;
  clearActiveDelivery: () => void;

  // Completed History
  completedDeliveries: CompletedDelivery[];
  completedTotal: number;
  completedPage: number;
  completedPages: number;
  completedLoading: boolean;
  completedError: string | null;
  setCompleted: (data: {
    deliveries: CompletedDelivery[];
    total: number;
    page: number;
    pages: number;
  }) => void;
  appendCompleted: (deliveries: CompletedDelivery[]) => void;
  setCompletedLoading: (v: boolean) => void;
  setCompletedError: (e: string | null) => void;

  // Today's Stats
  todayStats: DriverTodayStats | null;
  statsLoading: boolean;
  setTodayStats: (s: DriverTodayStats) => void;
  setStatsLoading: (v: boolean) => void;

  // Driver availability
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
}

export const useDriverDeliveryStore = create<DriverDeliveryState>((set, get) => ({
  // ── Tab ──────────────────────────────────────────────────────────────────────
  activeTab: "NEW_REQUESTS",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── New Requests ─────────────────────────────────────────────────────────────
  requests: [],
  requestsLoading: false,
  requestsError: null,
  setRequests: (requests) => set({ requests }),
  setRequestsLoading: (requestsLoading) => set({ requestsLoading }),
  setRequestsError: (requestsError) => set({ requestsError }),
  removeRequest: (requestId) =>
    set((s) => ({ requests: s.requests.filter((r) => r.requestId !== requestId) })),

  // ── Active Delivery ───────────────────────────────────────────────────────────
  activeDelivery: null,
  activeLoading: false,
  activeError: null,
  setActiveDelivery: (activeDelivery) => set({ activeDelivery }),
  setActiveLoading: (activeLoading) => set({ activeLoading }),
  setActiveError: (activeError) => set({ activeError }),

  advanceStage: (newStage, completedAt) =>
    set((s) => {
      if (!s.activeDelivery) return {};
      const steps = s.activeDelivery.progressSteps.map((step) => {
        if (step.key === s.activeDelivery!.currentStage) {
          return { ...step, status: "COMPLETED" as const, completedAt };
        }
        if (step.key === newStage) {
          return { ...step, status: "IN_PROGRESS" as const };
        }
        return step;
      });
      return {
        activeDelivery: {
          ...s.activeDelivery,
          currentStage: newStage,
          progressSteps: steps,
        },
      };
    }),

  markCashCollected: () =>
    set((s) => {
      if (!s.activeDelivery) return {};
      return { activeDelivery: { ...s.activeDelivery, cashCollected: true } };
    }),

  clearActiveDelivery: () => set({ activeDelivery: null }),

  // ── Completed History ─────────────────────────────────────────────────────────
  completedDeliveries: [],
  completedTotal: 0,
  completedPage: 1,
  completedPages: 1,
  completedLoading: false,
  completedError: null,
  setCompleted: ({ deliveries, total, page, pages }) =>
    set({ completedDeliveries: deliveries, completedTotal: total, completedPage: page, completedPages: pages }),
  appendCompleted: (deliveries) =>
    set((s) => ({
      completedDeliveries: [...s.completedDeliveries, ...deliveries],
      completedPage: s.completedPage + 1,
    })),
  setCompletedLoading: (completedLoading) => set({ completedLoading }),
  setCompletedError: (completedError) => set({ completedError }),

  // ── Today's Stats ─────────────────────────────────────────────────────────────
  todayStats: null,
  statsLoading: false,
  setTodayStats: (todayStats) => set({ todayStats }),
  setStatsLoading: (statsLoading) => set({ statsLoading }),

  // ── Availability ──────────────────────────────────────────────────────────────
  isOnline: false,
  setIsOnline: (isOnline) => set({ isOnline }),
}));