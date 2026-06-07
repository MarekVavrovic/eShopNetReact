import { createApi } from "@reduxjs/toolkit/query/react";
import type { Product } from "../../app/models/product";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import type { ProductParams } from "../../app/models/productParams";
import { filterEmptyValues } from "../../lib/util";
import type { Pagination } from "../../app/models/pagination";

export const catalogApi = createApi({
  reducerPath: "catalogApi",
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    //1.fetch all products
    fetchProducts: builder.query<{items: Product[], pagination: Pagination}, ProductParams>({
      query: (productParams) => {
        return {
          url: "products",
          params: filterEmptyValues(productParams),
        }
      },
      transformResponse: (items: Product[], meta) => {
                const paginationHeader = meta?.response?.headers.get('Pagination');
                const pagination = paginationHeader ? JSON.parse(paginationHeader) : null;
                return {items, pagination}
            }
    }),

    //2.query to fetch prod.details
    fetchProductsDetails: builder.query<Product, number>({
      query: (productId) => ({ url: `products/${productId}` }),
    }),
    //Fetch filters
    fetchFilters: builder.query<{ brands: string[]; types: string[] }, void>({
      query: () => ({ url: "products/filters" }),
    }),
  }),
});

export const {
  useFetchProductsDetailsQuery,
  useFetchProductsQuery,
  useFetchFiltersQuery,
} = catalogApi;
