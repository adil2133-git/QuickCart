import { useMemo } from "react";
import { create } from "zustand";
import { ProductsAPI, CategoriesAPI, type ProductFormValues } from "../productsApi";
import type { Product, Category, AvailabilityStatus } from "../types/product";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type SortKey = "productName" | "price" | "stockQuantity" | "createdAt";
export type SortDir = "asc" | "desc";

interface ProductState {
  // ── data ──
  products: Product[];
  categories: Category[];
  total: number;
  pages: number;

  // ── pagination ──
  page: number;
  limit: number;

  // ── filters (committed — i.e. already debounced for search) ──
  search: string;
  categoryFilter: string;
  statusFilter: "" | AvailabilityStatus;

  // ── sort ──
  sortKey: SortKey;
  sortDir: SortDir;

  // ── async/UI state ──
  loading: boolean;
  error: string | null;
  actionError: string | null;

  // ── actions: data fetching ──
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product>;

  // ── actions: filters/pagination/sort (each re-triggers a fetch as needed) ──
  setSearch: (search: string) => void;
  setCategoryFilter: (categoryId: string) => void;
  setStatusFilter: (status: "" | AvailabilityStatus) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  setSort: (key: SortKey) => void;

  // ── actions: mutations ──
  toggleAvailability: (product: Product) => Promise<void>;
  updateStock: (product: Product, newQty: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createProduct: (values: ProductFormValues, imageFiles: File[]) => Promise<Product>;
  updateProduct: (
    id: string,
    values: ProductFormValues,
    newImageFiles: File[],
    keptImageUrls: string[]
  ) => Promise<Product>;

  setActionError: (msg: string | null) => void;
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  total: 0,
  pages: 1,

  page: 1,
  limit: 20,

  search: "",
  categoryFilter: "",
  statusFilter: "",

  sortKey: "createdAt",
  sortDir: "desc",

  loading: true,
  error: null,
  actionError: null,

  fetchProducts: async () => {
    const { search, categoryFilter, statusFilter, page, limit } = get();
    set({ loading: true, error: null });
    try {
      const res = await ProductsAPI.list({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      set({
        products: res.products,
        total: res.total,
        pages: res.pages || 1,
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || "Couldn't load products. Check your connection and try again.",
        loading: false,
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await CategoriesAPI.list("ACTIVE");
      set({ categories });
    } catch {
      set({ categories: [] });
    }
  },

  // Edit-mode single-product fetch. Returns the product directly rather than
  // storing it — the Add/Edit page maps it into local form state, since the
  // form fields are component-local UI state, not shared/global state.
  fetchProductById: async (id) => {
    return ProductsAPI.getById(id);
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchProducts();
  },

  setCategoryFilter: (categoryFilter) => {
    set({ categoryFilter, page: 1 });
    get().fetchProducts();
  },

  setStatusFilter: (statusFilter) => {
    set({ statusFilter, page: 1 });
    get().fetchProducts();
  },

  setPage: (page) => {
    set({ page });
    get().fetchProducts();
  },

  clearFilters: () => {
    set({ search: "", categoryFilter: "", statusFilter: "", page: 1 });
    get().fetchProducts();
  },

  setSort: (key) => {
    const { sortKey, sortDir } = get();
    if (key === sortKey) {
      set({ sortDir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      set({ sortKey: key, sortDir: "asc" });
    }
    // No fetchProducts() call here — sorting is client-side on the current page
  },

  toggleAvailability: async (product) => {
    set({ actionError: null });
    // optimistic update
    set((state) => ({
      products: state.products.map((p) =>
        p._id === product._id
          ? { ...p, availabilityStatus: p.availabilityStatus === "AVAILABLE" ? "OUT_OF_STOCK" : "AVAILABLE" }
          : p
      ),
    }));
    try {
      await ProductsAPI.toggleAvailability(product._id);
    } catch (err: any) {
      // revert on failure
      set((state) => ({
        products: state.products.map((p) => (p._id === product._id ? product : p)),
        actionError: err?.response?.data?.message || "Couldn't update availability.",
      }));
    }
  },

  updateStock: async (product, newQty) => {
    set({ actionError: null });
    try {
      const updated = await ProductsAPI.updateStock(product._id, newQty);
      set((state) => ({
        products: state.products.map((p) => (p._id === product._id ? updated : p)),
      }));
    } catch (err: any) {
      set({ actionError: err?.response?.data?.message || "Couldn't update stock." });
      throw err;
    }
  },

  deleteProduct: async (id) => {
    set({ actionError: null });
    try {
      await ProductsAPI.remove(id);
      set((state) => ({
        products: state.products.filter((p) => p._id !== id),
        total: state.total - 1,
      }));
    } catch (err: any) {
      set({ actionError: err?.response?.data?.message || "Couldn't delete product." });
      throw err;
    }
  },

  createProduct: async (values, imageFiles) => {
    const product = await ProductsAPI.create(values, imageFiles);
    return product;
  },

  updateProduct: async (id, values, newImageFiles, keptImageUrls) => {
    const updated = await ProductsAPI.update(id, values, newImageFiles, keptImageUrls);
    // If this product is part of the currently loaded page, keep it in sync
    // so navigating back to the list doesn't show stale data before refetch.
    set((state) => ({
      products: state.products.map((p) => (p._id === id ? updated : p)),
    }));
    return updated;
  },

  setActionError: (msg) => set({ actionError: msg }),
}));

/* -------------------------------------------------------------------------- */
/*  Derived selector — use this hook instead of selectSortedProducts         */
/*  useMemo keeps the array reference stable so Zustand doesn't loop.        */
/* -------------------------------------------------------------------------- */

export function useSortedProducts(): Product[] {
  const products = useProductStore((s) => s.products);
  const sortKey = useProductStore((s) => s.sortKey);
  const sortDir = useProductStore((s) => s.sortDir);

  return useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "createdAt") {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else if (sortKey === "productName") {
        av = a.productName;
        bv = b.productName;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return copy;
  }, [products, sortKey, sortDir]);
}