import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithErrorHandling } from "../../app/api/baseApi";
import type { CreateOrder, Order } from "../../app/models/order";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWithErrorHandling,

  endpoints: (builder) => ({
    //GetOrders()
    fetchOrders: builder.query<Order[], void>({
      query: () => "orders",
    }),

    //GetOrderDetails(int id)
    fetchOrderDetailed: builder.query<Order, number>({
      query: (id) => ({
        url: `orders/${id}`,
      }),
    }),

    //CreateOrder(CreateOrderDto orderDto)
    createOrder: builder.mutation<Order, CreateOrder>({
      query: (order) => ({
        url: "orders",
        method: "POST",
        body: order,
      }),
    }),
  }),
});

export const {
  useFetchOrdersQuery,
  useFetchOrderDetailedQuery,
  useCreateOrderMutation,
} = orderApi;
