import { DEFAULT_PAGE_SIZE } from "./page-sizes";

import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";

export { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "./page-sizes";

export interface DataTableState {
  readonly pagination: PaginationState;
  readonly sorting: SortingState;
  readonly columnFilters: ColumnFiltersState;
}

export function createDefaultTableState(overrides?: Partial<DataTableState>): DataTableState {
  return {
    pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE, ...overrides?.pagination },
    sorting: overrides?.sorting ?? [],
    columnFilters: overrides?.columnFilters ?? [],
  };
}
