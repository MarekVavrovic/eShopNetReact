import { createApi} from "@reduxjs/toolkit/query/react";
import type { Product } from "../../app/models/product";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";



export const catalogApi = createApi({
    reducerPath: 'catalogApi',
    baseQuery:baseQueryWithErrorHandling,
    endpoints: (builder) => ({
        //1.fetch all products
        fetchProducts: builder.query<Product[], void>({
            query: () => ({url: 'products'})
        }),
        //2.query to fetch prod.details
       fetchProductsDetails:builder.query<Product,number>({
            query:(productId)=>({url:`products/${productId}`})
        })
    })
});

export const {useFetchProductsDetailsQuery,useFetchProductsQuery} = catalogApi;