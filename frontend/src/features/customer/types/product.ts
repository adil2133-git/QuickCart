export type AvailabilityStatus = "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN";

export interface Category {
  _id: string;
  categoryName: string;
  image: string;
  status: string;
}

export interface Product {
  _id: string;
  storeId: string;
  categoryId: Category;
  productName: string;
  description: string;
  price: number;
  stockQuantity: number;
  unit: string;
  images: string[];
  availabilityStatus: AvailabilityStatus;
  isBestseller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreInfo {
  _id: string;
  storeName: string;
  distance?: string;
  rating?: number;
  totalRatings?: number;
}

export interface Review {
  id: string;
  userName: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}