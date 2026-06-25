import { create } from "zustand";
import api from "../../../api/axios";
import type { StoreProfileSummary } from "../types/store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiGet<T = any>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const res = await api.get<T>(path, { params: cleanParams });
  return res.data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortKey = "nearest" | "rating" | "popular";

// ─── Store State & Actions ────────────────────────────────────────────────────

interface StoresListState {
  stores: StoreProfileSummary[];
  storesLoading: boolean;
  storesError: string | null;

  sortKey: SortKey;
  sortOpen: boolean;
  openNowOnly: boolean;

  // Actions
  fetchNearbyStores: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  setSortKey: (key: SortKey) => void;
  setSortOpen: (val: boolean) => void;
  setOpenNowOnly: (val: boolean) => void;
  resetStoresList: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: Omit<
  StoresListState,
  "fetchNearbyStores" | "setSortKey" | "setSortOpen" | "setOpenNowOnly" | "resetStoresList"
> = {
  stores: [],
  storesLoading: false,
  storesError: null,
  sortKey: "nearest",
  sortOpen: false,
  openNowOnly: false,
};

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useStoresListStore = create<StoresListState>((set) => ({
  ...initialState,

  // ── Nearby stores  →  GET /api/customer/stores/nearby ─────────────────────
  fetchNearbyStores: async (lat, lng, radiusKm = 10) => {
    set({ storesLoading: true, storesError: null });
    try {
      const data = await apiGet<{ stores: StoreProfileSummary[] }>(
        "/customer/stores/nearby",
        { lat, lng, radius: radiusKm }
      );
      set({ stores: data.stores || [] });
    } catch (err: any) {
      set({
        storesError:
          err?.response?.data?.message || err?.message || "Couldn't load nearby stores.",
      });
    } finally {
      set({ storesLoading: false });
    }
  },

  setSortKey: (sortKey) => set({ sortKey }),
  setSortOpen: (sortOpen) => set({ sortOpen }),
  setOpenNowOnly: (openNowOnly) => set({ openNowOnly }),

  resetStoresList: () => set({ ...initialState }),
}));