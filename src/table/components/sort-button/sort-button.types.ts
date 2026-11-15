import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { Column, RowData, SortDirection } from "@tanstack/react-table";

export type ColumnSortState = false | SortDirection;

export interface SortButtonProps<TData extends RowData> {
  readonly column: Column<TableFeaturesConfig, TData>;
}

export interface SortButtonViewModel {
  readonly title: string;
  readonly direction: ColumnSortState;
  readonly glyph: string;
  readonly ariaLabel: string;
  readonly onToggle: () => void;
}
