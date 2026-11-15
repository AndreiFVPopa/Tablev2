import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { ReactTable, RowData } from "@tanstack/react-table";
export interface DataTablePaginationProps<TData extends RowData> {
  readonly table: ReactTable<TableFeaturesConfig, TData>;
  readonly pageSizes: readonly number[];
}
export interface DataTablePaginationViewModel {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly start: number;
  readonly end: number;
  readonly totalRows: number;
  readonly pageSizes: readonly number[];
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly landmark: string;
  readonly pageSizeLabel: string;
  readonly summary: string;
  readonly pageOf: string;
  readonly firstLabel: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly lastLabel: string;
  readonly onPageSizeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  readonly onFirst: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onLast: () => void;
}
