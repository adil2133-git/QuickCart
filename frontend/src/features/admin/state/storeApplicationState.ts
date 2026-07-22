// src/features/admin/state/storeApplicationsState.ts
import { create } from "zustand";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";

export type StoreStatus = "pending" | "approved" | "rejected" | "more-info";

export interface ChecklistDoc {
  id: string;
  label: string;
  fileUrl: string | null;
  fileName: string | null;
  status: "verified" | "missing";
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ReviewNote {
  note: string;
  author: string;
  date: string;
}

export interface StoreApplication {
  id: string;
  storeCode: string;
  name: string;
  owner: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  fullAddress: string;
  pincode: string | null;
  type: string;
  products: number;
  radius: string;
  logoInitial: string | null;
  status: StoreStatus;
  checklist: ChecklistDoc[];
  documentsSubmitted: number;
  documentsTotal: number;
  dateLabel: string;
  submittedOn: string;
  createdAt: string;
  coordinates: Coordinates | null;
  rejectionReason?: string | null;
  reviewNotes?: ReviewNote[];
}

export interface StoreApplicationStats {
  pending: number;
  approved: number;
  rejected: number;
  requiringAttention: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationFilters {
  search: string;
  status: string; // "All" | "Pending" | "Approved" | "Rejected"
  city: string; // "All Cities" | ...
  date: string; // "" | "YYYY-MM-DD"
  page: number;
  limit: number;
}

export type StoreDecision = "approve" | "reject" | "more-info";

const DEFAULT_FILTERS: ApplicationFilters = {
  search: "",
  status: "All",
  city: "All Cities",
  date: "",
  page: 1,
  limit: 4,
};

interface StoreApplicationsState {
  // ── List page ────────────────────────────────────────────────────────
  applications: StoreApplication[];
  pagination: PaginationInfo | null;
  stats: StoreApplicationStats | null;
  filters: ApplicationFilters;
  listLoading: boolean;
  listError: string | null;

  setFilters: (partial: Partial<Omit<ApplicationFilters, "page" | "limit">>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  fetchApplications: () => Promise<void>;
  fetchStats: () => Promise<void>;

  // ── Review page (single application) ────────────────────────────────
  currentApplication: StoreApplication | null;
  detailLoading: boolean;
  detailError: string | null;
  fetchApplicationById: (id: string) => Promise<void>;
  clearCurrentApplication: () => void;

  noteDraft: string;
  setNoteDraft: (v: string) => void;
  savingNote: boolean;
  noteError: string | null;
  addNote: (id: string) => Promise<void>;

  decision: StoreDecision | null;
  decisionReason: string;
  submitting: boolean;
  submittedDecision: StoreDecision | null;
  decisionError: string | null;
  setDecision: (d: StoreDecision | null) => void;
  setDecisionReason: (v: string) => void;
  submitDecision: (id: string) => Promise<void>;
  resetDecisionUI: () => void;
}

export const useStoreApplicationsStore = create<StoreApplicationsState>((set, get) => ({
  applications: [],
  pagination: null,
  stats: null,
  filters: DEFAULT_FILTERS,
  listLoading: false,
  listError: null,

  setFilters: (partial) => {
    set((state) => ({
      filters: { ...state.filters, ...partial, page: 1 }, // any filter change resets to page 1
    }));
    get().fetchApplications();
  },

  setPage: (page) => {
    set((state) => ({ filters: { ...state.filters, page } }));
    get().fetchApplications();
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    get().fetchApplications();
  },

  fetchApplications: async () => {
    const { filters } = get();
    set({ listLoading: true, listError: null });
    try {
      const res = await api.get("/admin/store/applications", {
        params: {
          search: filters.search,
          status: filters.status,
          city: filters.city,
          date: filters.date || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      });
      set({
        applications: res.data.applications,
        pagination: res.data.pagination,
        listLoading: false,
      });
    } catch (err: unknown) {
      set({
        listError: getApiErrorMessage(err, "Failed to load applications."),
        listLoading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get("/admin/store/applications/stats");
      set({ stats: res.data.stats });
    } catch {
      set({ stats: null });
    }
  },

  // ── Review page ──────────────────────────────────────────────────────
  currentApplication: null,
  detailLoading: false,
  detailError: null,

  fetchApplicationById: async (id) => {
    set({ detailLoading: true, detailError: null, currentApplication: null });
    try {
      const res = await api.get(`/admin/store/applications/${id}`);
      set({ currentApplication: res.data.application, detailLoading: false });
    } catch (err: unknown) {
      set({
        detailError: getApiErrorMessage(err, "Failed to load application."),
        detailLoading: false,
      });
    }
  },

  clearCurrentApplication: () => {
    set({
      currentApplication: null,
      detailError: null,
      noteDraft: "",
      noteError: null,
      decision: null,
      decisionReason: "",
      submittedDecision: null,
      decisionError: null,
    });
  },

  noteDraft: "",
  setNoteDraft: (v) => set({ noteDraft: v }),
  savingNote: false,
  noteError: null,

  addNote: async (id) => {
    const note = get().noteDraft.trim();
    if (!note) return;
    set({ savingNote: true, noteError: null });
    try {
      const res = await api.post(`/admin/store/applications/${id}/notes`, { note });
      set((state) => ({
        currentApplication: state.currentApplication
          ? { ...state.currentApplication, reviewNotes: res.data.reviewNotes }
          : state.currentApplication,
        noteDraft: "",
        savingNote: false,
      }));
    } catch (err: unknown) {
      set({
        noteError: getApiErrorMessage(err, "Failed to add note."),
        savingNote: false,
      });
    }
  },

  decision: null,
  decisionReason: "",
  submitting: false,
  submittedDecision: null,
  decisionError: null,

  setDecision: (d) => set({ decision: d }),
  setDecisionReason: (v) => set({ decisionReason: v }),

  submitDecision: async (id) => {
    const { decision, decisionReason } = get();
    if (!decision) return;
    const requiresReason = decision === "reject" || decision === "more-info";
    if (requiresReason && !decisionReason.trim()) return;

    set({ submitting: true, decisionError: null });
    try {
      const res = await api.post(`/admin/store/applications/${id}/decision`, {
        decision,
        reason: decisionReason.trim() || undefined,
      });
      set((state) => ({
        submittedDecision: decision,
        submitting: false,
        currentApplication: state.currentApplication
          ? { ...state.currentApplication, status: res.data.status }
          : state.currentApplication,
        // Keep the list page's cached copy in sync too, so navigating back
        // doesn't show a stale "Pending" badge until a refetch.
        applications: state.applications.map((a) =>
          a.id === id ? { ...a, status: res.data.status === "ACTIVE" ? "approved" : res.data.status === "REJECTED" ? "rejected" : a.status } : a
        ),
      }));
    } catch (err: unknown) {
      set({
        decisionError: getApiErrorMessage(err, "Failed to submit decision."),
        submitting: false,
      });
    }
  },

  resetDecisionUI: () => {
    set({
      decision: null,
      decisionReason: "",
      submittedDecision: null,
      decisionError: null,
    });
  },
}));