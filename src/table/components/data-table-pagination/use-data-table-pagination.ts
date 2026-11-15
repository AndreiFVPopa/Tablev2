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
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(table.getPageCount(), 1);
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
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
    landmark: labels.paginationLandmark,
    pageSizeLabel: labels.paginationPageSize,
    summary: `${String(start)}–${String(end)} ${labels.paginationRowsOf} ${String(totalRows)}`,
    pageOf: `${String(pageIndex + 1)} ${labels.paginationPageOf} ${String(pageCount)}`,
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
      table.setPageIndex(pageCount - 1);
    },
  };
}
