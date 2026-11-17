import type { TableColumnDef } from "@table/lib/column-factory";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { DataTableState } from "@table/lib/table-state.types";
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
}

export interface UseDataTableResult<TSchema extends z.ZodObject> {
  readonly table: ReactTable<TableFeaturesConfig, TableSchemaRow<TSchema>>;
  readonly columns: TableColumnDef<TableSchemaRow<TSchema>>[];
  readonly resolvedLabels: TableLabels;
}
