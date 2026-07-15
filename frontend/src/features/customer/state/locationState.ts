import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../../../api/axios";

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

async function apiGet<T>(path: string): Promise<T> {
    const res = await api.get<T>(path);
    return res.data;
}

interface LocationState {
    profile: CustomerProfile | null;
    activeCoords: { lat: number; lng: number } | null;
    activeAddress: SavedAddress | null;

    profileLoading: boolean;
    profileError: string | null;

    showLocationModal: boolean;

    fetchProfile: () => Promise<void>;
    onLocationSaved: () => Promise<void>;
    openLocationModal: () => void;
    closeLocationModal: () => void;
    resetLocation: () => void;
}

type PersistedFields = "fetchProfile" | "onLocationSaved" | "openLocationModal" | "closeLocationModal" | "resetLocation";

const initialState: Omit<LocationState, PersistedFields> = {
    profile: null,
    activeCoords: null,
    activeAddress: null,
    profileLoading: true,
    profileError: null,
    showLocationModal: false,
};

// picks the customer's default address, falling back to the first saved one
function resolveDefault(profile: CustomerProfile): SavedAddress | undefined {
    return (
        profile.savedAddresses.find((a) => a._id === profile.defaultAddress) ??
        profile.savedAddresses[0]
    );
}

export const useLocationStore = create<LocationState>()(
    persist(
        (set, get) => ({
            ...initialState,

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
                        // no address saved yet — prompt for one before they can order
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

            // called after LocationPickerModal saves a new address
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
            // only persist the resolved coords/address — profile itself is re-fetched fresh on load
            partialize: (state) => ({
                activeCoords: state.activeCoords,
                activeAddress: state.activeAddress,
            }),
        }
    )
);