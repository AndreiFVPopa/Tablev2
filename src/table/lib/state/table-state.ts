import { DEFAULT_PAGE_SIZE } from "./page-sizes";

import type { DataTableState } from "./table-state.types";

export { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "./page-sizes";
export type { DataTableState } from "./table-state.types";

export function createDefaultTableState(overrides?: Partial<DataTableState>): DataTableState {
  return {
    pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE, ...overrides?.pagination },
    sorting: overrides?.sorting ?? [],
    columnFilters: overrides?.columnFilters ?? [],
  };
}
