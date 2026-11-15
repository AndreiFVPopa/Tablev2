import { describe, expect, it } from "vitest";

import { loadProductsFixture } from "@mocks/products/load-products-fixture";
import { DATA_SOURCES } from "@shared/api/data-source";
import { DatasetValidationError } from "@shared/lib/dataset-validation";

import { fetchProducts } from "./products.requests";

import type { Product } from "../products.types";

describe("fetchProducts", () => {
  it("loads and validates the fixture source", async () => {
    const products = await fetchProducts({ source: DATA_SOURCES.FIXTURE });
    expect(products).toHaveLength(24);
    const first: Product | undefined = products[0];
    expect(first?.listedAt).toBeInstanceOf(Date);
  });

  it("uses the HTTP adapter without a live service", async () => {
    const products = await fetchProducts({
      source: DATA_SOURCES.HTTP,
      getJson: () => Promise.resolve(loadProductsFixture()),
    });
    expect(products).toHaveLength(24);
  });

  it("surfaces validation errors from HTTP payloads", async () => {
    await expect(
      fetchProducts({
        source: DATA_SOURCES.HTTP,
        getJson: () => Promise.resolve([{ id: "bad" }]),
      }),
    ).rejects.toBeInstanceOf(DatasetValidationError);
  });
});
