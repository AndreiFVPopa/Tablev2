import type { TableColumnDef } from "@table/lib/column-factory";
import type { DataMode } from "@table/lib/state/data-mode.constants";
import type { DataTableState } from "@table/lib/state/table-state.types";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { TableLabels } from "@table/table-labels.types";
import type { ReactTable, RowData } from "@tanstack/react-table";
import type { z } from "zod";

export type TableSchemaRow<TSchema extends z.ZodObject> = z.output<TSchema> & RowData;

export interface UseDataTableOptions<TSchema extends z.ZodObject> {
  readonly schema: TSchema;
  readonly data: readonly TableSchemaRow<TSchema>[];
  readonly state: DataTableState;
  readonly onStateChange: (nextState: DataTableState) => void;
  readonly labels?: Partial<TableLabels>;
  readonly dataMode?: DataMode;
  readonly totalRows?: number | null;
}

export interface UseDataTableResult<TSchema extends z.ZodObject> {
  readonly table: ReactTable<TableFeaturesConfig, TableSchemaRow<TSchema>>;
  readonly columns: TableColumnDef<TableSchemaRow<TSchema>>[];
  readonly resolvedLabels: TableLabels;
}
