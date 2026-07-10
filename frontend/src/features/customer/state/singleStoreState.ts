import { create } from "zustand";
import api from "../../../api/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  _id: string;
  categoryName: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Product {
  _id: string;
  storeId: string;
  categoryId?: Category | null;
  productName: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unit: string;
  images: string[];
  availabilityStatus: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
}

export interface OperatingHour {
  day: string;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
}

export interface StoreProfileSummary {
  _id: string;
  storeName: string;
  address: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  operatingHours: OperatingHour[];
  status: "OPEN" | "CLOSED" | "BUSY";
  averageRating: number;
  reviewCount: number;
  totalOrders: number;
  distanceKm: number | null;
}

export interface RatingBar {
  star: number;
  count: number;
  pct: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  bars: RatingBar[];
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  name: string;
  initials: string;
}

export interface PaginatedProducts {
  total: number;
  page: number;
  pages: number;
  products: Product[];
}

export type SortValue = "newest" | "priceAsc" | "priceDesc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Store State & Actions ────────────────────────────────────────────────────

interface SingleStoreState {
  // Store profile
  store: StoreProfileSummary | null;
  storeLoading: boolean;
  storeError: string | null;

  // Bestsellers
  bestsellers: Product[];
  bestsellersLoading: boolean;

  // Categories
  categories: Category[];

  // Products
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  page: number;
  pages: number;
  loadingMore: boolean;

  // Filters
  activeCategory: string;
  searchInput: string;
  search: string;
  sort: SortValue;
  sortOpen: boolean;

  // Reviews
  ratingSummary: RatingSummary | null;
  reviews: Review[];
  reviewsLoading: boolean;

  // UI
  followed: boolean;

  // Actions — store profile
  fetchStore: (storeId: string) => Promise<void>;

  // Actions — bestsellers
  fetchBestsellers: (storeId: string) => Promise<void>;

  // Actions — categories
  fetchCategories: () => Promise<void>;

  // Actions — products
  fetchProducts: (
    storeId: string,
    pageNum: number,
    opts?: { append?: boolean }
  ) => Promise<void>;

  // Actions — reviews
  fetchReviews: (storeId: string) => Promise<void>;

  // Actions — filters / UI
  setActiveCategory: (cat: string) => void;
  setSearchInput: (val: string) => void;
  setSearch: (val: string) => void;
  setSort: (val: SortValue) => void;
  setSortOpen: (val: boolean) => void;
  toggleFollowed: () => void;

  // Reset when navigating away
  resetStore: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: Omit<
  SingleStoreState,
  | "fetchStore"
  | "fetchBestsellers"
  | "fetchCategories"
  | "fetchProducts"
  | "fetchReviews"
  | "setActiveCategory"
  | "setSearchInput"
  | "setSearch"
  | "setSort"
  | "setSortOpen"
  | "toggleFollowed"
  | "resetStore"
> = {
  store: null,
  storeLoading: true,
  storeError: null,

  bestsellers: [],
  bestsellersLoading: true,

  categories: [],

  products: [],
  productsLoading: true,
  productsError: null,
  page: 1,
  pages: 1,
  loadingMore: false,

  activeCategory: "All",
  searchInput: "",
  search: "",
  sort: "newest",
  sortOpen: false,

  ratingSummary: null,
  reviews: [],
  reviewsLoading: true,

  followed: false,
};

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useSingleStoreStore = create<SingleStoreState>((set, get) => ({
  ...initialState,

  // ── Store profile  →  GET /api/customer/:storeId ────────────────────────────
  fetchStore: async (storeId) => {
    set({ storeLoading: true, storeError: null });
    try {
      const data = await apiGet<{ store: StoreProfileSummary }>(`/customer/${storeId}`);
      set({ store: data.store });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      set({
        storeError:
          axiosError?.response?.data?.message || axiosError?.message || "Something went wrong.",
      });
    } finally {
      set({ storeLoading: false });
    }
  },

  // ── Bestsellers  →  GET /api/customer/:storeId/bestsellers ─────────────────
  fetchBestsellers: async (storeId) => {
    set({ bestsellersLoading: true });
    try {
      const data = await apiGet<{ products: Product[] }>(
        `/customer/${storeId}/bestsellers`,
        { limit: 4 }
      );
      set({ bestsellers: data.products || [] });
    } catch {
      set({ bestsellers: [] });
    } finally {
      set({ bestsellersLoading: false });
    }
  },

  // ── Categories  →  GET /api/store/getCategories ────────────────────────────
  fetchCategories: async () => {
    try {
      const data = await apiGet<{ categories: Category[] }>(`/store/getCategories`, {
        status: "ACTIVE",
      });
      set({ categories: data.categories || [] });
    } catch {
      set({ categories: [] });
    }
  },

  // ── Products  →  GET /api/customer/:storeId/products ───────────────────────
  fetchProducts: async (storeId, pageNum, { append = false } = {}) => {
    const { search, activeCategory, sort } = get();

    if (append) {
      set({ loadingMore: true, productsError: null });
    } else {
      set({ productsLoading: true, productsError: null });
    }

    try {
      const data = await apiGet<PaginatedProducts>(`/customer/${storeId}/products`, {
        page: pageNum,
        limit: 8,
        search: search || undefined,
        categoryId: activeCategory !== "All" ? activeCategory : undefined,
        sort,
      });

      set((state) => ({
        products: append
          ? [...state.products, ...(data.products || [])]
          : data.products || [],
        pages: data.pages || 1,
        page: data.page || 1,
      }));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      set({
        productsError:
          axiosError?.response?.data?.message || axiosError?.message || "Something went wrong.",
      });
    } finally {
      if (append) {
        set({ loadingMore: false });
      } else {
        set({ productsLoading: false });
      }
    }
  },

  // ── Reviews  →  GET /api/customer/:storeId/reviews/* ───────────────────────
  fetchReviews: async (storeId) => {
    set({ reviewsLoading: true });
    try {
      const [summaryData, reviewsData] = await Promise.allSettled([
        apiGet<RatingSummary>(`/customer/${storeId}/reviews/summary`),
        apiGet<{ reviews: Review[] }>(`/customer/${storeId}/reviews`, { limit: 6 }),
      ]);

      set({
        ratingSummary:
          summaryData.status === "fulfilled" ? summaryData.value : null,
        reviews:
          reviewsData.status === "fulfilled"
            ? reviewsData.value.reviews || []
            : [],
      });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  // ── Filters & UI ───────────────────────────────────────────────────────────
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchInput: (val) => set({ searchInput: val }),
  setSearch: (val) => set({ search: val }),
  setSort: (val) => set({ sort: val }),
  setSortOpen: (val) => set({ sortOpen: val }),
  toggleFollowed: () => set((state) => ({ followed: !state.followed })),

  // ── Reset ──────────────────────────────────────────────────────────────────
  resetStore: () => set({ ...initialState }),
}));