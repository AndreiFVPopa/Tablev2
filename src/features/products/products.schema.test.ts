import { describe, expect, it } from "vitest";

import { loadProductsFixture } from "@mocks/products/load-products-fixture";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";
import { interpretSchema } from "@table/schema/interpret";

import { productSchema, productsDatasetSchema } from "./products.schema";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) throw new Error("expected array fixture");
  const rows: Record<string, unknown>[] = [];
  for (const row of raw) {
    if (!isPlainRecord(row)) throw new Error("expected object row");
    rows.push({ ...row });
  }
  return rows;
}

describe("productSchema", () => {
  it("validates the fixture and coerces listedAt to Date", () => {
    const result = productsDatasetSchema.safeParse(loadProductsFixture());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(24);
    expect(result.data[0]?.listedAt).toBeInstanceOf(Date);
    expect(
      result.data.some((row) => row.discontinuedAt === null || row.discontinuedAt === undefined),
    ).toBe(true);
  });

  it("rejects invalid records instead of dropping them", () => {
    const rows = asRecordArray(loadProductsFixture());
    const first = rows[0];
    if (first === undefined) throw new Error("expected at least one row");
    const invalid = [{ ...first, price: -1 }, ...rows.slice(1)];
    const result = productsDatasetSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("is compatible with the Phase 2 interpreter", () => {
    const { fields, diagnostics } = interpretSchema(productSchema);
    expect(diagnostics).toEqual([]);
    const byPath = Object.fromEntries(fields.map((field) => [field.path, field.kind]));
    expect(byPath.id).toBe(FIELD_KINDS.TEXT);
    expect(byPath.title).toBe(FIELD_KINDS.TEXT);
    expect(byPath.sku).toBe(FIELD_KINDS.TEXT);
    expect(byPath.price).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.stock).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.category).toBe(FIELD_KINDS.ENUM);
    expect(byPath.available).toBe(FIELD_KINDS.BOOLEAN);
    expect(byPath.listedAt).toBe(FIELD_KINDS.DATE);
    expect(byPath.tags).toBe(FIELD_KINDS.TAGS);
    expect(byPath["supplier.name"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath["supplier.country"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath.discontinuedAt).toBe(FIELD_KINDS.DATE);
  });

  it("exposes Romanian titles via metadata", () => {
    const { fields } = interpretSchema(productSchema);
    const titles = Object.fromEntries(fields.map((field) => [field.path, field.meta.title]));
    expect(titles.title).toBe("Titlu");
    expect(titles.listedAt).toBe("Listat");
    expect(titles["supplier.country"]).toBe("Țară");
  });
});
