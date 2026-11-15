import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { ReactTable, RowData } from "@tanstack/react-table";

export interface TableBodyProps<TData extends RowData> {
  readonly table: ReactTable<TableFeaturesConfig, TData>;
  readonly columnCount: number;
  readonly emptyLabel: string;
}
