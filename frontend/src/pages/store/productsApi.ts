// productsApi.ts
import api from "../../api/axios";
import type { Product, Category, AvailabilityStatus } from "./product";

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  status?: AvailabilityStatus;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  total: number;
  page: number;
  pages: number;
  products: Product[];
}

export interface ProductFormValues {
  productName: string;
  description: string;
  categoryId: string;
  price: string;
  stockQuantity: string;
  unit: string;
  availabilityStatus: AvailabilityStatus;
}

// Builds multipart/form-data for create/update since the backend routes go through
// uploadProductImages (multer). newImageFiles are raw File objects from the dropzone;
// keptImageUrls are existing Cloudinary URLs the user chose to keep (edit mode only).
function buildProductFormData(
  values: ProductFormValues,
  newImageFiles: File[],
  keptImageUrls?: string[]
): FormData {
  const fd = new FormData();
  fd.append("productName", values.productName);
  fd.append("description", values.description);
  fd.append("categoryId", values.categoryId);
  fd.append("price", values.price);
  fd.append("stockQuantity", values.stockQuantity);
  fd.append("unit", values.unit);
  fd.append("availabilityStatus", values.availabilityStatus);

  if (keptImageUrls !== undefined) {
    fd.append("existingImages", JSON.stringify(keptImageUrls));
  }

  newImageFiles.forEach((file) => fd.append("images", file));

  return fd;
}

export const ProductsAPI = {
  list: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    const { data } = await api.get("/store/getProductsByStore", { params });
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/store/getSingleProduct/${id}`);
    return data.product;
  },

  create: async (values: ProductFormValues, imageFiles: File[]): Promise<Product> => {
    const formData = buildProductFormData(values, imageFiles);
    const { data } = await api.post("/store/addProduct", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.product;
  },

  update: async (
    id: string,
    values: ProductFormValues,
    newImageFiles: File[],
    keptImageUrls: string[]
  ): Promise<Product> => {
    const formData = buildProductFormData(values, newImageFiles, keptImageUrls);
    const { data } = await api.put(`/store/updateProduct/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.product;
  },

  toggleAvailability: async (id: string): Promise<AvailabilityStatus> => {
    const { data } = await api.patch(`/store/toggleAvailability/${id}`);
    return data.availabilityStatus;
  },

  updateStock: async (id: string, stockQuantity: number): Promise<Product> => {
    const { data } = await api.patch(`/store/updateStock/${id}`, { stockQuantity });
    return data.product;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/store/deleteProduct/${id}`);
  },
};

export const CategoriesAPI = {
  list: async (status?: "ACTIVE" | "INACTIVE"): Promise<Category[]> => {
    const { data } = await api.get("/store/getCategories", {
      params: status ? { status } : undefined,
    });
    return data.categories;
  },
};