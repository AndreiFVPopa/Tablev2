import { useTable } from "@tanstack/react-table";
import { useMemo } from "react";

import { buildColumnsFromDescriptors, type TableColumnDef } from "@table/lib/column-factory";
import { TABLE_FEATURES, type TableFeaturesConfig } from "@table/lib/table-features";
import { interpretSchema } from "@table/schema/index";
import { resolveLabels, type TableLabels } from "@table/table-labels";

import type { DataTableState } from "@table/lib/table-state";
import type {
  ReactTable,
  ColumnFiltersState,
  PaginationState,
  RowData,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import type { z } from "zod";
export interface UseDataTableOptions<TData extends RowData> {
  readonly schema: z.ZodType;
  readonly data: readonly TData[];
  readonly state: DataTableState;
  readonly onStateChange: (next: DataTableState) => void;
  readonly labels?: Partial<TableLabels>;
}
export interface UseDataTableResult<TData extends RowData> {
  readonly table: ReactTable<TableFeaturesConfig, TData>;
  readonly columns: TableColumnDef<TData>[];
  readonly resolvedLabels: TableLabels;
}
export function useDataTable<TData extends RowData>({
  schema,
  data,
  state,
  onStateChange,
  labels,
}: UseDataTableOptions<TData>): UseDataTableResult<TData> {
  const resolvedLabels = useMemo(() => resolveLabels(labels), [labels]);
  const columns = useMemo<TableColumnDef<TData>[]>(() => {
    const { fields } = interpretSchema(schema);
    return buildColumnsFromDescriptors<TData>(fields);
  }, [schema]);
  const updatePagination = (updater: Updater<PaginationState>): void => {
    const next = typeof updater === "function" ? updater(state.pagination) : updater;
    const pageSizeChanged = next.pageSize !== state.pagination.pageSize;
    onStateChange({
      ...state,
      pagination: pageSizeChanged ? { ...next, pageIndex: 0 } : next,
    });
  };
  const updateSorting = (updater: Updater<SortingState>): void => {
    const next = typeof updater === "function" ? updater(state.sorting) : updater;
    onStateChange({ ...state, sorting: next });
  };
  const updateColumnFilters = (updater: Updater<ColumnFiltersState>): void => {
    const next = typeof updater === "function" ? updater(state.columnFilters) : updater;
    onStateChange({
      ...state,
      columnFilters: next,
      pagination: { ...state.pagination, pageIndex: 0 },
    });
  };
  const table = useTable({
    features: TABLE_FEATURES,
    data,
    columns,
    state: {
      pagination: state.pagination,
      sorting: state.sorting,
      columnFilters: state.columnFilters,
    },
    onPaginationChange: updatePagination,
    onSortingChange: updateSorting,
    onColumnFiltersChange: updateColumnFilters,
    autoResetPageIndex: false,
  });

  return { table, columns, resolvedLabels };
}
