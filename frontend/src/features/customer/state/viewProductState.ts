import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "../types/product";


export interface ViewedProduct {
  _id: string;
  productName: string;
  price: number;
  images: string[];
  unit?: string;
  storeId: string;
  categoryId: Category;
  viewedAt: number; // timestamp for ordering
}

const BATCH_SIZE = 5;
const MAX_STORED = 20;

interface ViewedProductsState {
  displayed: ViewedProduct[];       // what's shown on the home page (updated in batches)
  pending: ViewedProduct[];         // viewed since last batch update
  recordView: (product: ViewedProduct) => void;
}

export const useViewedProductsStore = create<ViewedProductsState>()(
  persist(
    (set, get) => ({
      displayed: [],
      pending: [],

      recordView: (product) => {
        const { pending, displayed } = get();

        // Deduplicate — remove existing entry if present (we'll re-add at front)
        const filteredPending = pending.filter((p) => p._id !== product._id);
        const newPending = [{ ...product, viewedAt: Date.now() }, ...filteredPending];

        if (newPending.length >= BATCH_SIZE) {
          // Batch is full — merge pending into displayed, deduplicate, trim to MAX_STORED
          const merged = [...newPending, ...displayed.filter(
            (d) => !newPending.some((p) => p._id === d._id)
          )].slice(0, MAX_STORED);

          set({ displayed: merged, pending: [] });
        } else {
          set({ pending: newPending });
        }
      },
    }),
    {
      name: "quickkart-viewed-products",
      partialize: (state) => ({
        displayed: state.displayed,
        pending: state.pending,
      }),
    }
  )
);