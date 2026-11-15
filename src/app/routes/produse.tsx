import { createFileRoute } from "@tanstack/react-router";

import { ProductsPage } from "@features/products/products-page";
import { productSchema } from "@features/products/products.schema";
import { composeTableSearchValidator } from "@table/index";

export const Route = createFileRoute("/produse")({
  validateSearch: composeTableSearchValidator(productSchema),
  component: ProductsPage,
});
