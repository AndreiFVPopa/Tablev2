import { queryOptions } from "@tanstack/react-query";

import { fetchProducts } from "./products.requests";

export const productsQueryKeys = {
  all: ["products"] as const,
  list: () => [...productsQueryKeys.all, "list"] as const,
};

export function productsQueryOptions() {
  return queryOptions({
    queryKey: productsQueryKeys.list(),
    queryFn: () => fetchProducts(),
  });
}
