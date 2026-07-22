import { create } from "zustand";
import api from "../../../api/axios";
import { getApiErrorMessage as getErrorMessage } from "../../../api/apiError";

/* -------------------------------------------------------------------------- */
/*  Types — mirrored from getMyStoreProfile's response shape                 */
/* -------------------------------------------------------------------------- */

export interface DocumentStatus {
  label: string;
  key: string;
  submitted: boolean;
}

export interface OperatingHour {
  day: string;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
}

export interface StoreMe {
  name: string;
  phone: string;
  email: string;
  storeId: string;
  registeredOn: string;
  role: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  storeName: string;
  ownerName: string;
  address: string;
  pincode: string | null;
  storeStatus: "OPEN" | "CLOSED" | "BUSY";
  logoUrl: string | null;
  coverImageUrl: string | null;
  isManuallyClosed: boolean;
  operatingHours: OperatingHour[];
  documents: DocumentStatus[];
}

type BrandingField = "logo" | "coverImage";

interface StoreProfileState {
  store: StoreMe | null;
  loading: boolean;
  error: string | null;

  savingClose: boolean;
  uploadingLogo: boolean;
  uploadingCover: boolean;
  actionError: string | null;
  actionSuccess: string | null;

  fetchProfile: () => Promise<void>;
  toggleManualClose: () => Promise<void>;
  uploadBranding: (field: BrandingField, file: File) => Promise<void>;

  setActionError: (msg: string | null) => void;
  clearActionSuccess: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

export const useStoreProfileStore = create<StoreProfileState>((set, get) => ({
  store: null,
  loading: true,
  error: null,

  savingClose: false,
  uploadingLogo: false,
  uploadingCover: false,
  actionError: null,
  actionSuccess: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/store/me");
      set({ store: res.data.store, loading: false });
    } catch (err: unknown) {
      set({
        error: getErrorMessage(err, "Couldn't load your store profile."),
        loading: false,
      });
    }
  },

  toggleManualClose: async () => {
    const { store } = get();
    if (!store) return;

    set({ savingClose: true, actionError: null });
    const prev = store.isManuallyClosed;
    // optimistic update
    set({ store: { ...store, isManuallyClosed: !prev } });

    try {
      const res = await api.patch("/store/toggleManualClose");
      set((state) =>
        state.store
          ? { store: { ...state.store, isManuallyClosed: res.data.isManuallyClosed }, savingClose: false }
          : { savingClose: false }
      );
      set({ actionSuccess: res.data.message });
      setTimeout(() => set({ actionSuccess: null }), 2500);
    } catch (err: unknown) {
      // revert on failure
      set((state) => ({
        store: state.store ? { ...state.store, isManuallyClosed: prev } : state.store,
        actionError: getErrorMessage(err, "Couldn't update store status."),
        savingClose: false,
      }));
    }
  },

  uploadBranding: async (field, file) => {
    const setUploading = (val: boolean) =>
      set(field === "logo" ? { uploadingLogo: val } : { uploadingCover: val });

    setUploading(true);
    set({ actionError: null });
    try {
      const formData = new FormData();
      formData.append(field, file);
      const res = await api.patch("/store/branding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((state) => ({
        store: state.store
          ? {
              ...state.store,
              logoUrl: res.data.logoUrl ?? state.store.logoUrl,
              coverImageUrl: res.data.coverImageUrl ?? state.store.coverImageUrl,
            }
          : state.store,
      }));
      const msg = field === "logo" ? "Logo updated." : "Cover image updated.";
      set({ actionSuccess: msg });
      setTimeout(() => set({ actionSuccess: null }), 2500);
    } catch (err: unknown) {
      set({ actionError: getErrorMessage(err, "Upload failed. Try a smaller image.") });
    } finally {
      setUploading(false);
    }
  },

  setActionError: (msg) => set({ actionError: msg }),
  clearActionSuccess: () => set({ actionSuccess: null }),
}));