import { create } from "zustand";
import { toast } from "sonner";
import api from "../../../api/axios";
import type { OperatingHour } from "./storeProfileState";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface StoreSettings {
  storeName: string;
  address: string;
  pincode: string | null;
  operatingHours: OperatingHour[];
  documents: { label: string; key: string; submitted: boolean }[];
  coordinates: { lat: number; lng: number };
}

// Notification prefs have no backend field yet (see dev-note in the page) —
// kept entirely in this store's local state, never sent to the server.
export interface NotificationPrefs {
  orderAlerts: boolean;
  inventoryAlerts: boolean;
  emailSummaries: boolean;
}

interface StoreSettingsState {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;

  savingInfo: boolean;
  savingHours: boolean;
  actionError: string | null;
  actionSuccess: string | null;

  // Draft copies the user edits before saving — keeps the "Discard Changes"
  // affordance trivial (just re-fetch / reset draft from settings).
  infoDraft: { storeName: string; address: string; pincode: string };
  hoursDraft: OperatingHour[];

  notificationPrefs: NotificationPrefs;

  fetchSettings: () => Promise<void>;
  setInfoDraft: (field: "storeName" | "address" | "pincode", value: string) => void;
  setHoursDraft: (day: string, field: "openTime" | "closeTime" | "isClosed", value: string | boolean) => void;
  saveStoreInfo: () => Promise<void>;
  saveOperatingHours: () => Promise<void>;
  toggleNotificationPref: (key: keyof NotificationPrefs) => void;
  discardChanges: () => void;

  setActionError: (msg: string | null) => void;
  clearActionSuccess: () => void;
}

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function sortByDay(hours: OperatingHour[]): OperatingHour[] {
  return [...hours].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

export const useStoreSettingsStore = create<StoreSettingsState>((set, get) => ({
  settings: null,
  loading: true,
  error: null,

  savingInfo: false,
  savingHours: false,
  actionError: null,
  actionSuccess: null,

  infoDraft: { storeName: "", address: "", pincode: "" },
  hoursDraft: [],

  // Local-only — no backend field on StoreProfile yet. See dev-note in
  // NotificationPreferencesCard for what schema + endpoint would light this up.
  notificationPrefs: {
    orderAlerts: true,
    inventoryAlerts: true,
    emailSummaries: false,
  },

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/store/me");
      const store = res.data.store;
      const settings: StoreSettings = {
        storeName: store.storeName,
        address: store.address,
        pincode: store.pincode,
        operatingHours: sortByDay(store.operatingHours || []),
        documents: store.documents || [],
        coordinates: store.coordinates || { lat: 0, lng: 0 },
      };
      set({
        settings,
        loading: false,
        infoDraft: {
          storeName: settings.storeName,
          address: settings.address,
          pincode: settings.pincode || "",
        },
        hoursDraft: settings.operatingHours,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Couldn't load store settings.",
        loading: false,
      });
    }
  },

  setInfoDraft: (field, value) =>
    set((state) => ({ infoDraft: { ...state.infoDraft, [field]: value } })),

  setHoursDraft: (day, field, value) =>
    set((state) => ({
      hoursDraft: state.hoursDraft.map((h) => (h.day === day ? { ...h, [field]: value } : h)),
    })),

  saveStoreInfo: async () => {
    const { infoDraft } = get();
    if (!infoDraft.storeName.trim() || !infoDraft.address.trim()) {
      const msg = "Store name and address can't be empty.";
      set({ actionError: msg });
      toast.error(msg);
      return;
    }

    set({ savingInfo: true, actionError: null });
    try {
      const res = await api.patch("/store/info", {
        storeName: infoDraft.storeName,
        address: infoDraft.address,
        pincode: infoDraft.pincode || null,
      });
      set((state) => ({
        settings: state.settings
          ? {
              ...state.settings,
              storeName: res.data.storeName,
              address: res.data.address,
              pincode: res.data.pincode,
            }
          : state.settings,
        savingInfo: false,
        actionSuccess: res.data.message,
      }));
      toast.success(res.data.message || "Store information updated.");
      setTimeout(() => set({ actionSuccess: null }), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Couldn't update store information.";
      set({ actionError: msg, savingInfo: false });
      toast.error(msg);
    }
  },

  saveOperatingHours: async () => {
    const { hoursDraft } = get();
    set({ savingHours: true, actionError: null });
    try {
      const res = await api.patch("/store/hours", { operatingHours: hoursDraft });
      const updated = sortByDay(res.data.operatingHours || hoursDraft);
      set((state) => ({
        settings: state.settings ? { ...state.settings, operatingHours: updated } : state.settings,
        hoursDraft: updated,
        savingHours: false,
        actionSuccess: res.data.message,
      }));
      toast.success(res.data.message || "Operating hours updated.");
      setTimeout(() => set({ actionSuccess: null }), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Couldn't update operating hours.";
      set({ actionError: msg, savingHours: false });
      toast.error(msg);
    }
  },

  // Local-only — flips state and shows a toast, nothing persisted server-side.
  toggleNotificationPref: (key) =>
    set((state) => ({
      notificationPrefs: { ...state.notificationPrefs, [key]: !state.notificationPrefs[key] },
    })),

  discardChanges: () => {
    const { settings } = get();
    if (!settings) return;
    set({
      infoDraft: {
        storeName: settings.storeName,
        address: settings.address,
        pincode: settings.pincode || "",
      },
      hoursDraft: settings.operatingHours,
      actionError: null,
    });
    toast("Changes discarded.");
  },

  setActionError: (msg) => set({ actionError: msg }),
  clearActionSuccess: () => set({ actionSuccess: null }),
}));