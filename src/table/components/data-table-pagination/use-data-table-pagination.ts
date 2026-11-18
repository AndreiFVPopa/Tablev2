import { useLabels } from "../labels-context";

import type { DataTablePaginationViewModel } from "./data-table-pagination.types";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { ReactTable, RowData } from "@tanstack/react-table";
export function useDataTablePagination<TData extends RowData>(
  table: ReactTable<TableFeaturesConfig, TData>,
  pageSizes: readonly number[],
): DataTablePaginationViewModel {
  const labels = useLabels();
  const { pageIndex, pageSize } = table.state.pagination;
  const unknownTotal = table.options.pageCount === -1;
  const visibleRows = table.getRowModel().rows.length;
  const totalRows = unknownTotal ? visibleRows : table.getRowCount();
  const pageCount = unknownTotal ? 0 : Math.max(table.getPageCount(), 1);
  const start = visibleRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = visibleRows === 0 ? 0 : start + visibleRows - 1;
  const canPrevious = table.getCanPreviousPage();
  const canNext = unknownTotal
    ? visibleRows > 0 && visibleRows === pageSize
    : table.getCanNextPage();
  const canLast = unknownTotal ? false : table.getCanLastPage();
  const range = `${String(start)}–${String(end)}`;
  return {
    pageIndex,
    pageSize,
    pageCount,
    start,
    end,
    totalRows,
    pageSizes,
    canPrevious,
    canNext,
    canLast,
    landmark: labels.paginationLandmark,
    pageSizeLabel: labels.paginationPageSize,
    summary: unknownTotal ? range : `${range} ${labels.paginationRowsOf} ${String(totalRows)}`,
    pageOf: unknownTotal
      ? String(pageIndex + 1)
      : `${String(pageIndex + 1)} ${labels.paginationPageOf} ${String(pageCount)}`,
    firstLabel: labels.paginationFirst,
    previousLabel: labels.paginationPrevious,
    nextLabel: labels.paginationNext,
    lastLabel: labels.paginationLast,
    onPageSizeChange: (event) => {
      table.setPageSize(Number(event.target.value));
    },
    onFirst: () => {
      table.setPageIndex(0);
    },
    onPrevious: () => {
      table.previousPage();
    },
    onNext: () => {
      table.nextPage();
    },
    onLast: () => {
      if (pageCount < 1) return;
      table.setPageIndex(pageCount - 1);
    },
  };
}
