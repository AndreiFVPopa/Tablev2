import type { DataMode } from "@table/lib/state/data-mode.constants";
import type { DataTableState } from "@table/lib/state/table-state";
import type { TableLabels } from "@table/table-labels";
import type { z } from "zod";

export interface DataTableSharedProps<TSchema extends z.ZodObject> {
  readonly schema: TSchema;
  readonly data: readonly NoInfer<z.output<TSchema>>[];
  readonly labels?: Partial<TableLabels>;
  readonly pageSizes?: readonly number[];
}

export interface DataTableClientSource {
  readonly dataMode?: Extract<DataMode, "client">;
  readonly totalRows?: never;
}

export interface DataTableServerSource {
  readonly dataMode: Extract<DataMode, "server">;
  readonly totalRows: number | null;
}

export type DataTableDataSource = DataTableClientSource | DataTableServerSource;

export type DataTableControlledProps<TSchema extends z.ZodObject> =
  DataTableSharedProps<TSchema> & {
    readonly state: DataTableState;
    readonly onStateChange: (nextState: DataTableState) => void;

    readonly urlNamespace?: never;
  };

export type DataTableUrlBackedProps<TSchema extends z.ZodObject> = DataTableSharedProps<TSchema> & {
  readonly state?: never;
  readonly onStateChange?: never;
  readonly urlNamespace?: string;
};

export type DataTableProps<TSchema extends z.ZodObject> = (
  DataTableControlledProps<TSchema> | DataTableUrlBackedProps<TSchema>
) &
  DataTableDataSource;

export function isControlledDataTableProps<TSchema extends z.ZodObject>(
  props: DataTableProps<TSchema>,
): props is DataTableControlledProps<TSchema> {
  return "state" in props && "onStateChange" in props;
}
