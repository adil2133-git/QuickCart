// src/features/customer/state/locationState.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SavedAddress {
    _id: string;
    label: string;
    address: string;
    coordinates: { lat: number; lng: number };
}

export interface CustomerProfile {
    savedAddresses: SavedAddress[];
    defaultAddress: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
    const res = await api.get<T>(path);
    return res.data;
}

// ─── Store State & Actions ────────────────────────────────────────────────────

interface LocationState {
    profile: CustomerProfile | null;
    activeCoords: { lat: number; lng: number } | null;
    activeAddress: SavedAddress | null;

    profileLoading: boolean;
    profileError: string | null;

    showLocationModal: boolean;

    // Actions
    fetchProfile: () => Promise<void>;
    onLocationSaved: () => Promise<void>;
    openLocationModal: () => void;
    closeLocationModal: () => void;
    resetLocation: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: Omit<
    LocationState,
    "fetchProfile" | "onLocationSaved" | "openLocationModal" | "closeLocationModal" | "resetLocation"
> = {
    profile: null,
    activeCoords: null,
    activeAddress: null,
    profileLoading: true,
    profileError: null,
    showLocationModal: false,
};

// ─── Shared resolver: pick default address, falling back to first saved ──────

function resolveDefault(profile: CustomerProfile): SavedAddress | undefined {
    return (
        profile.savedAddresses.find((a) => a._id === profile.defaultAddress) ??
        profile.savedAddresses[0]
    );
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ── Profile  →  GET /api/customer/profile ─────────────────────────────
            fetchProfile: async () => {
                set({ profileLoading: true, profileError: null });
                try {
                    const data = await apiGet<{ profile: CustomerProfile }>("/customer/profile");
                    const profile = data.profile;
                    const def = resolveDefault(profile);

                    set({
                        profile,
                        activeAddress: def ?? null,
                        activeCoords: def?.coordinates?.lat ? def.coordinates : null,
                        showLocationModal: !profile.defaultAddress || profile.savedAddresses.length === 0,
                    });
                } catch (err: unknown) {
                    const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
                    set({
                        profileError:
                            axiosError?.response?.data?.message || axiosError?.message || "Couldn't load your saved location.",
                    });
                } finally {
                    set({ profileLoading: false });
                }
            },

            // ── Called after LocationPickerModal saves a new address ──────────────
            onLocationSaved: async () => {
                set({ showLocationModal: false });
                await get().fetchProfile();
            },

            openLocationModal: () => set({ showLocationModal: true }),
            closeLocationModal: () => set({ showLocationModal: false }),

            resetLocation: () => set({ ...initialState }),
        }),
        {
            name: "quickkart-location",
            // Only persist the resolved coords/address — re-fetch profile fresh on load
            partialize: (state) => ({
                activeCoords: state.activeCoords,
                activeAddress: state.activeAddress,
            }),
        }
    )
);