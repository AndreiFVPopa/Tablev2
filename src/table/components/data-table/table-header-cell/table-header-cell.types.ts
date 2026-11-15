import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { Header, RowData } from "@tanstack/react-table";

export interface TableHeaderCellProps<TData extends RowData> {
  readonly header: Header<TableFeaturesConfig, TData>;
}
