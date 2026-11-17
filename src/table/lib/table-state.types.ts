import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";

export interface DataTableState {
  readonly pagination: PaginationState;
  readonly sorting: SortingState;
  readonly columnFilters: ColumnFiltersState;
}
