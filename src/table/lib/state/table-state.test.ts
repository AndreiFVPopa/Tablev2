import { describe, expect, it } from "vitest";

import { DEFAULT_PAGE_SIZE } from "./page-sizes";
import { createDefaultTableState } from "./table-state";

describe("createDefaultTableState", () => {
  it("returns sensible defaults", () => {
    const state = createDefaultTableState();
    expect(state.pagination.pageIndex).toBe(0);
    expect(state.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(state.sorting).toEqual([]);
    expect(state.columnFilters).toEqual([]);
  });

  it("accepts partial overrides for each slice", () => {
    const state = createDefaultTableState({
      pagination: { pageIndex: 2, pageSize: 50 },
      sorting: [{ id: "name", desc: true }],
      columnFilters: [{ id: "status", value: "done" }],
    });
    expect(state.pagination).toEqual({ pageIndex: 2, pageSize: 50 });
    expect(state.sorting).toEqual([{ id: "name", desc: true }]);
    expect(state.columnFilters).toEqual([{ id: "status", value: "done" }]);
  });
});
