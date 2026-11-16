import type { DataTableState } from "@table/lib/table-state";
import type { TableLabels } from "@table/table-labels";
import type { RowData } from "@tanstack/react-table";
import type { z } from "zod";

export interface DataTableBaseProps<TData extends RowData> {
  readonly schema: z.ZodType;
  readonly data: readonly TData[];
  readonly labels?: Partial<TableLabels>;
  readonly pageSizes?: readonly number[];
}

export type DataTableControlledProps<TData extends RowData> = DataTableBaseProps<TData> & {
  readonly state: DataTableState;
  readonly onStateChange: (nextState: DataTableState) => void;

  readonly urlNamespace?: never;
};

export type DataTableUrlBackedProps<TData extends RowData> = DataTableBaseProps<TData> & {
  readonly state?: never;
  readonly onStateChange?: never;
  readonly urlNamespace?: string;
};

export type DataTableProps<TData extends RowData> =
  DataTableControlledProps<TData> | DataTableUrlBackedProps<TData>;

export function isControlledDataTableProps<TData extends RowData>(
  props: DataTableProps<TData>,
): props is DataTableControlledProps<TData> {
  return "state" in props && "onStateChange" in props;
}
