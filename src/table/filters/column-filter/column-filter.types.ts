import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { Column, RowData } from "@tanstack/react-table";
export interface ColumnFilterProps<TData extends RowData> {
  readonly column: Column<TableFeaturesConfig, TData>;
}
