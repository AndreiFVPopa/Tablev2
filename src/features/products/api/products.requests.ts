import { loadProductsFixture } from "@mocks/products/load-products-fixture";
import { DATA_SOURCES, resolveDataSource } from "@shared/api/data-source";
import { getJson, type JsonGetter } from "@shared/api/http";
import { parseDataset } from "@shared/lib/dataset-validation";

import { productsDatasetSchema } from "../products.schema";

import type { ProductsDataset } from "../products.types";
import type { DataSourceKind } from "@shared/api/data-source";

const PRODUCTS_HTTP_URL = "/api/products";

export interface FetchProductsOptions {
  readonly source?: DataSourceKind;
  readonly getJson?: JsonGetter;
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<ProductsDataset> {
  const source = options.source ?? resolveDataSource();
  const loadJson = options.getJson ?? getJson;
  const raw =
    source === DATA_SOURCES.HTTP ? await loadJson(PRODUCTS_HTTP_URL) : loadProductsFixture();
  return parseDataset(productsDatasetSchema, raw, "produse");
}
