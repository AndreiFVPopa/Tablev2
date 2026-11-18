import { describe, expect, it } from "vitest";

import { DEFAULT_PAGE_SIZE, resolveDefaultPageSize } from "./page-sizes";

describe("resolveDefaultPageSize", () => {
  it("prefers DEFAULT_PAGE_SIZE when it is in the allowed list", () => {
    expect(resolveDefaultPageSize([10, 25, 50, 100])).toBe(DEFAULT_PAGE_SIZE);
  });

  it("falls back to the first allowed size otherwise", () => {
    expect(resolveDefaultPageSize([1, 2, 10])).toBe(1);
  });

  it("falls back to DEFAULT_PAGE_SIZE when the allowed list is empty", () => {
    expect(resolveDefaultPageSize([])).toBe(DEFAULT_PAGE_SIZE);
  });
});
