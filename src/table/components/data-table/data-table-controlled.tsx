import { DEFAULT_PAGE_SIZES } from "@table/lib/page-sizes";

import { DataTablePagination } from "../data-table-pagination";
import { LabelsProvider } from "../labels-context";

import styles from "./data-table.module.scss";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { useDataTable } from "./use-data-table";

import type { DataTableControlledProps } from "./data-table.types";
import type { z } from "zod";

export function DataTableControlled<TSchema extends z.ZodObject>({
  schema,
  data,
  state,
  onStateChange,
  labels,
  pageSizes = DEFAULT_PAGE_SIZES,
}: DataTableControlledProps<TSchema>): React.JSX.Element {
  const { table, columns, resolvedLabels } = useDataTable({
    schema,
    data,
    state,
    onStateChange,
    ...(labels !== undefined ? { labels } : {}),
  });

  return (
    <LabelsProvider value={resolvedLabels}>
      <div className={styles.dataTable}>
        <div className={styles.dataTable__scroll}>
          <table className={styles.dataTable__table} aria-label={resolvedLabels.tableLandmark}>
            <TableHeader table={table} />
            <TableBody
              table={table}
              columnCount={columns.length}
              emptyLabel={resolvedLabels.tableEmpty}
            />
          </table>
        </div>
        <DataTablePagination table={table} pageSizes={pageSizes} />
      </div>
    </LabelsProvider>
  );
}
