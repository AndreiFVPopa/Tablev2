import styles from "./data-table-pagination.module.scss";
import { useDataTablePagination } from "./use-data-table-pagination";

import type { DataTablePaginationProps } from "./data-table-pagination.types";
import type { RowData } from "@tanstack/react-table";

export function DataTablePagination<TData extends RowData>({
  table,
  pageSizes,
}: DataTablePaginationProps<TData>): React.JSX.Element {
  const pagination = useDataTablePagination(table, pageSizes);
  return (
    <nav aria-label={pagination.landmark} className={styles.pagination}>
      <div className={styles.pagination__pageSize}>
        <label>
          <span>{pagination.pageSizeLabel}</span>
          <select
            value={pagination.pageSize}
            onChange={pagination.onPageSizeChange}
            className={styles.pagination__pageSizeSelect}
          >
            {pagination.pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <span className={styles.pagination__summary} aria-live="polite">
        {pagination.summary}
      </span>

      <div className={styles.pagination__controls}>
        <button
          type="button"
          onClick={pagination.onFirst}
          disabled={!pagination.canPrevious}
          aria-label={pagination.firstLabel}
        >
          «
        </button>
        <button
          type="button"
          onClick={pagination.onPrevious}
          disabled={!pagination.canPrevious}
          aria-label={pagination.previousLabel}
        >
          ‹
        </button>
        <span className={styles.pagination__pageOf}>{pagination.pageOf}</span>
        <button
          type="button"
          onClick={pagination.onNext}
          disabled={!pagination.canNext}
          aria-label={pagination.nextLabel}
        >
          ›
        </button>
        <button
          type="button"
          onClick={pagination.onLast}
          disabled={!pagination.canLast}
          aria-label={pagination.lastLabel}
        >
          »
        </button>
      </div>
    </nav>
  );
}
