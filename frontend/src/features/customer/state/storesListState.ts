import { create } from "zustand";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import type { StoreProfileSummary } from "../types/store";

async function apiGet<T>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const res = await api.get<T>(path, { params: cleanParams });
  return res.data;
}

export type SortKey = "nearest" | "rating" | "popular";

interface StoresListState {
  stores: StoreProfileSummary[];
  storesLoading: boolean;
  storesError: string | null;

  sortKey: SortKey;
  sortOpen: boolean;
  openNowOnly: boolean;

  fetchNearbyStores: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  setSortKey: (key: SortKey) => void;
  setSortOpen: (val: boolean) => void;
  setOpenNowOnly: (val: boolean) => void;
  resetStoresList: () => void;
}

type ActionKeys = "fetchNearbyStores" | "setSortKey" | "setSortOpen" | "setOpenNowOnly" | "resetStoresList";

const initialState: Omit<StoresListState, ActionKeys> = {
  stores: [],
  storesLoading: false,
  storesError: null,
  sortKey: "nearest",
  sortOpen: false,
  openNowOnly: false,
};

export const useStoresListStore = create<StoresListState>((set) => ({
  ...initialState,

  // GET /api/customer/stores/nearby
  fetchNearbyStores: async (lat, lng, radiusKm = 10) => {
    set({ storesLoading: true, storesError: null });
    try {
      const data = await apiGet<{ stores: StoreProfileSummary[] }>(
        "/customer/stores/nearby",
        { lat, lng, radius: radiusKm }
      );
      set({ stores: data.stores || [] });
    } catch (err: unknown) {
      set({
        storesError: getApiErrorMessage(err, err instanceof Error ? err.message : "Couldn't load nearby stores."),
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