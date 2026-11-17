import { useTable } from "@tanstack/react-table";
import { useMemo } from "react";

import { buildColumnsFromDescriptors, type TableColumnDef } from "@table/lib/column-factory";
import { TABLE_FEATURES } from "@table/lib/table-features";
import { interpretSchema } from "@table/schema/index";
import { resolveLabels } from "@table/table-labels";

import type {
  TableSchemaRow,
  UseDataTableOptions,
  UseDataTableResult,
} from "./use-data-table.types";
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import type { z } from "zod";

export type { UseDataTableOptions, UseDataTableResult } from "./use-data-table.types";

export function useDataTable<TSchema extends z.ZodObject>({
  schema,
  data,
  state,
  onStateChange,
  labels,
}: UseDataTableOptions<TSchema>): UseDataTableResult<TSchema> {
  const resolvedLabels = useMemo(() => resolveLabels(labels), [labels]);
  const columns = useMemo<TableColumnDef<TableSchemaRow<TSchema>>[]>(() => {
    const { fields } = interpretSchema(schema);
    return buildColumnsFromDescriptors<TableSchemaRow<TSchema>>(fields);
  }, [schema]);
  const updatePagination = (updater: Updater<PaginationState>): void => {
    const nextPagination = typeof updater === "function" ? updater(state.pagination) : updater;
    const pageSizeChanged = nextPagination.pageSize !== state.pagination.pageSize;
    onStateChange({
      ...state,
      pagination: pageSizeChanged ? { ...nextPagination, pageIndex: 0 } : nextPagination,
    });
  };
  const updateSorting = (updater: Updater<SortingState>): void => {
    const nextSorting = typeof updater === "function" ? updater(state.sorting) : updater;
    onStateChange({ ...state, sorting: nextSorting });
  };
  const updateColumnFilters = (updater: Updater<ColumnFiltersState>): void => {
    const nextColumnFilters =
      typeof updater === "function" ? updater(state.columnFilters) : updater;
    onStateChange({
      ...state,
      columnFilters: nextColumnFilters,
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
