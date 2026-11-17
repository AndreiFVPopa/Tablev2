import type { DataTableState } from "@table/lib/table-state";
import type { TableLabels } from "@table/table-labels";
import type { z } from "zod";

export interface DataTableBaseProps<TSchema extends z.ZodObject> {
  readonly schema: TSchema;
  readonly data: readonly NoInfer<z.output<TSchema>>[];
  readonly labels?: Partial<TableLabels>;
  readonly pageSizes?: readonly number[];
}

export type DataTableControlledProps<TSchema extends z.ZodObject> = DataTableBaseProps<TSchema> & {
  readonly state: DataTableState;
  readonly onStateChange: (nextState: DataTableState) => void;

  readonly urlNamespace?: never;
};

export type DataTableUrlBackedProps<TSchema extends z.ZodObject> = DataTableBaseProps<TSchema> & {
  readonly state?: never;
  readonly onStateChange?: never;
  readonly urlNamespace?: string;
};

export type DataTableProps<TSchema extends z.ZodObject> =
  DataTableControlledProps<TSchema> | DataTableUrlBackedProps<TSchema>;

export function isControlledDataTableProps<TSchema extends z.ZodObject>(
  props: DataTableProps<TSchema>,
): props is DataTableControlledProps<TSchema> {
  return "state" in props && "onStateChange" in props;
}
