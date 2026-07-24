import { useEffect } from "react";
import axios from "axios";
import api from "../../../api/axios";
import { getApiErrorMessage } from "../../../api/apiError";
import { useProductDetailStore } from "../state/productState";
import type { Product } from "../types/product";

// fetches a product by ID from the public store endpoint and hydrates
// productDetailStore. Accepts an optional storeId override — if omitted,
// the store-owner endpoint is used instead (requires auth)
export const useProductDetail = (productId: string, storeId?: string) => {
  const { setProduct, setLoading, setError, product, isLoading, error } =
    useProductDetailStore();

  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // public endpoint when a storeId is available (customer view),
        // otherwise fall back to the store-owner endpoint
        const url = storeId
          ? `/customer/${storeId}/products/${productId}`
          : `/store/getSingleProduct/${productId}`;

        const res = await api.get<{ product: Product }>(url, {
          signal: controller.signal,
        });

        setProduct(res.data.product);
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name === "CanceledError" || name === "AbortError" || axios.isCancel(err)) return;
        setError(
          getApiErrorMessage(err, err instanceof Error ? err.message : "An unexpected error occurred.")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [productId, storeId, setProduct, setLoading, setError]);

  return { product, isLoading, error };
};