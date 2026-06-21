// types.ts
// Mirrors the real Product and Category mongoose schemas exactly.
// No mock-data-only fields (e.g. weeklySold) — those don't exist in the DB yet.

export type AvailabilityStatus = "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";
export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface Category {
  _id: string;
  categoryName: string;
  image?: string;
  status: CategoryStatus;
  createdAt: string;
}

export interface Product {
  _id: string;
  storeId: string;
  categoryId: Category | string; // populated object when fetched via the API, string if unpopulated
  productName: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unit: string;
  images: string[];
  availabilityStatus: AvailabilityStatus;
  createdAt: string;
}

// Low-stock threshold — not stored in DB, a frontend-only display rule.
export const LOW_STOCK_THRESHOLD = 10;

export type DerivedStatus = "ACTIVE" | "LOW_STOCK" | "OUT_OF_STOCK" | "HIDDEN";

/**
 * The DB only stores availabilityStatus (AVAILABLE / OUT_OF_STOCK / HIDDEN).
 * "Low stock" and "Active" are presentation-layer states derived from stock count,
 * so the badge can warn the owner before stock actually hits zero.
 */
export function getDerivedStatus(product: Product): DerivedStatus {
  if (product.availabilityStatus === "HIDDEN") return "HIDDEN";
  if (product.availabilityStatus === "OUT_OF_STOCK" || product.stockQuantity === 0) {
    return "OUT_OF_STOCK";
  }
  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "ACTIVE";
}

export function getCategoryName(categoryId: Product["categoryId"]): string {
  return typeof categoryId === "string" ? "—" : categoryId.categoryName;
}

export function getCategoryImage(categoryId: Product["categoryId"]): string | undefined {
  return typeof categoryId === "string" ? undefined : categoryId.image;
}