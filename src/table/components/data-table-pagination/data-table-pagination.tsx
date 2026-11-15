import styles from "./data-table-pagination.module.scss";
import { useDataTablePagination } from "./use-data-table-pagination";

import type { DataTablePaginationProps } from "./data-table-pagination.types";
import type { RowData } from "@tanstack/react-table";
export function DataTablePagination<TData extends RowData>({
  table,
  pageSizes,
}: DataTablePaginationProps<TData>): React.JSX.Element {
  const vm = useDataTablePagination(table, pageSizes);
  return (
    <nav aria-label={vm.landmark} className={styles.pagination}>
      <div className={styles.pageSizeGroup}>
        <label>
          <span>{vm.pageSizeLabel}</span>
          <select
            value={vm.pageSize}
            onChange={vm.onPageSizeChange}
            className={styles.pageSizeSelect}
          >
            {vm.pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <span className={styles.summary} aria-live="polite">
        {vm.summary}
      </span>

      <div className={styles.pageControls}>
        <button
          type="button"
          onClick={vm.onFirst}
          disabled={!vm.canPrevious}
          aria-label={vm.firstLabel}
        >
          «
        </button>
        <button
          type="button"
          onClick={vm.onPrevious}
          disabled={!vm.canPrevious}
          aria-label={vm.previousLabel}
        >
          ‹
        </button>
        <span className={styles.pageOf}>{vm.pageOf}</span>
        <button type="button" onClick={vm.onNext} disabled={!vm.canNext} aria-label={vm.nextLabel}>
          ›
        </button>
        <button type="button" onClick={vm.onLast} disabled={!vm.canNext} aria-label={vm.lastLabel}>
          »
        </button>
      </div>
    </nav>
  );
}
