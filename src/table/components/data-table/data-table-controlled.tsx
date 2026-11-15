import { DEFAULT_PAGE_SIZES } from "@table/lib/page-sizes";

import { DataTablePagination } from "../data-table-pagination";
import { LabelsProvider } from "../labels-context";

import styles from "./data-table.module.scss";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { useDataTable } from "./use-data-table";

import type { DataTableControlledProps } from "./data-table.types";
import type { RowData } from "@tanstack/react-table";

export function DataTableControlled<TData extends RowData>({
  schema,
  data,
  state,
  onStateChange,
  labels,
  pageSizes = DEFAULT_PAGE_SIZES,
}: DataTableControlledProps<TData>): React.JSX.Element {
  const { table, columns, resolvedLabels } = useDataTable({
    schema,
    data,
    state,
    onStateChange,
    ...(labels !== undefined ? { labels } : {}),
  });

  return (
    <LabelsProvider value={resolvedLabels}>
      <div className={styles.wrapper}>
        <table className={styles.table} aria-label={resolvedLabels.tableLandmark}>
          <TableHeader table={table} />
          <TableBody
            table={table}
            columnCount={columns.length}
            emptyLabel={resolvedLabels.tableEmpty}
          />
        </table>
        <DataTablePagination table={table} pageSizes={pageSizes} />
      </div>
    </LabelsProvider>
  );
}
