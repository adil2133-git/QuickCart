import { create } from "zustand";

export interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  store: {
    storeName: string;
    coordinates: { lat: number; lng: number } | null;
  };
  driver: {
    name: string;
    phone: string | null;
    vehicleType: string | null;
    vehicleNumber: string | null;
    currentLocation: { lat: number; lng: number } | null;
  };
}

interface ActiveDeliveryState {
  delivery: ActiveDelivery | null;
  isLoading: boolean;
  isMinimized: boolean;
  setDelivery: (delivery: ActiveDelivery | null) => void;
  setLoading: (loading: boolean) => void;
  updateDriverLocation: (orderId: string, lat: number, lng: number) => void;
  updateStatus: (orderId: string, orderStatus: string) => void;
  setMinimized: (minimized: boolean) => void;
}

export const useActiveDeliveryStore = create<ActiveDeliveryState>((set, get) => ({
  delivery: null,
  isLoading: true,
  isMinimized: false,

  setDelivery: (delivery) => set({ delivery, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  updateDriverLocation: (orderId, lat, lng) => {
    const { delivery } = get();
    if (!delivery || delivery.orderId !== orderId) return;
    set({ delivery: { ...delivery, driver: { ...delivery.driver, currentLocation: { lat, lng } } } });
  },

  updateStatus: (orderId, orderStatus) => {
    const { delivery } = get();
    if (!delivery || delivery.orderId !== orderId) return;
    // once delivered or cancelled there's nothing left to track — clear it
    // so the floating widget disappears instead of showing a stale order
    if (orderStatus === "DELIVERED" || orderStatus === "CANCELLED") {
      set({ delivery: null, isMinimized: false });
    } else {
      set({ delivery: { ...delivery, orderStatus } });
    }
  },

  setMinimized: (isMinimized) => set({ isMinimized }),
}));