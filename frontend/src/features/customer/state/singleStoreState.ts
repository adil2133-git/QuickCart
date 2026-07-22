import { create } from "zustand";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";

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

interface SingleStoreState {
  store: StoreProfileSummary | null;
  storeLoading: boolean;
  storeError: string | null;

  bestsellers: Product[];
  bestsellersLoading: boolean;

  categories: Category[];

  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  page: number;
  pages: number;
  loadingMore: boolean;

  activeCategory: string;
  searchInput: string;
  search: string;
  sort: SortValue;
  sortOpen: boolean;

  ratingSummary: RatingSummary | null;
  reviews: Review[];
  reviewsLoading: boolean;

  followed: boolean;

  fetchStore: (storeId: string) => Promise<void>;
  fetchBestsellers: (storeId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProducts: (
    storeId: string,
    pageNum: number,
    opts?: { append?: boolean }
  ) => Promise<void>;
  fetchReviews: (storeId: string) => Promise<void>;

  setActiveCategory: (cat: string) => void;
  setSearchInput: (val: string) => void;
  setSearch: (val: string) => void;
  setSort: (val: SortValue) => void;
  setSortOpen: (val: boolean) => void;
  toggleFollowed: () => void;

  resetStore: () => void;
}

type ActionKeys =
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
  | "resetStore";

const initialState: Omit<SingleStoreState, ActionKeys> = {
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

export const useSingleStoreStore = create<SingleStoreState>((set, get) => ({
  ...initialState,

  // GET /api/customer/:storeId
  fetchStore: async (storeId) => {
    set({ storeLoading: true, storeError: null });
    try {
      const data = await apiGet<{ store: StoreProfileSummary }>(`/customer/${storeId}`);
      set({ store: data.store });
    } catch (err: unknown) {
      set({
        storeError: getApiErrorMessage(err, err instanceof Error ? err.message : "Something went wrong."),
      });
    } finally {
      set({ storeLoading: false });
    }
  },

  // GET /api/customer/:storeId/bestsellers
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

  // GET /api/store/getCategories
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

  // GET /api/customer/:storeId/products
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
      set({
        productsError: getApiErrorMessage(err, err instanceof Error ? err.message : "Something went wrong."),
      });
    } finally {
      if (append) {
        set({ loadingMore: false });
      } else {
        set({ productsLoading: false });
      }
    }
  },

  // GET /api/customer/:storeId/reviews and /reviews/summary
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

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchInput: (val) => set({ searchInput: val }),
  setSearch: (val) => set({ search: val }),
  setSort: (val) => set({ sort: val }),
  setSortOpen: (val) => set({ sortOpen: val }),
  toggleFollowed: () => set((state) => ({ followed: !state.followed })),

  resetStore: () => set({ ...initialState }),
}));