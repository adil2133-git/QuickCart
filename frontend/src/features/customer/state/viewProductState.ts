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
  displayed: ViewedProduct[]; // what's shown on the home page — only updates once BATCH_SIZE new views pile up
  pending: ViewedProduct[];   // views recorded since the last batch flush
  recordView: (product: ViewedProduct) => void;
}

export const useViewedProductsStore = create<ViewedProductsState>()(
  persist(
    (set, get) => ({
      displayed: [],
      pending: [],

      // batching avoids the "recently viewed" row reshuffling on the home page
      // after every single product click — it only updates once BATCH_SIZE
      // new views have piled up
      recordView: (product) => {
        const { pending, displayed } = get();

        // remove any existing entry for this product so it moves to the front instead of duplicating
        const filteredPending = pending.filter((p) => p._id !== product._id);
        const newPending = [{ ...product, viewedAt: Date.now() }, ...filteredPending];

        if (newPending.length >= BATCH_SIZE) {
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