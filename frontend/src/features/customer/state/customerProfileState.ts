// src/features/customer/state/customerProfileStore.ts
import { create } from "zustand";
import { useAuthStore } from "../../../features/auth/state/authState";
import type { CustomerProfile, SavedAddress } from "../types/customerProfile";

interface CustomerProfileState {
  profile: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;

  setProfile: (profile: CustomerProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addAddress: (address: SavedAddress, defaultAddress: string | null) => void;
  removeAddress: (id: string, defaultAddress: string | null) => void;
  setDefaultAddressLocal: (id: string) => void;

  clearProfile: () => void;
}

export const useCustomerProfileStore = create<CustomerProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addAddress: (address, defaultAddress) =>
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: {
          ...state.profile,
          savedAddresses: [...state.profile.savedAddresses, address],
          defaultAddress,
        },
      };
    }),

  removeAddress: (id, defaultAddress) =>
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: {
          ...state.profile,
          savedAddresses: state.profile.savedAddresses.filter((a) => a._id !== id),
          defaultAddress,
        },
      };
    }),

  setDefaultAddressLocal: (id) =>
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: {
          ...state.profile,
          defaultAddress: id,
        },
      };
    }),

  clearProfile: () => set({ profile: null, isLoading: false, error: null }),
}));

// Reactively clear profile when user logs out
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useCustomerProfileStore.getState().clearProfile();
    }
  }
);