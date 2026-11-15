import type { FieldDescriptor } from "../schema/index";
import type { RowData, TableFeatures } from "@tanstack/react-table";
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the TanStack augmentation shape; the generics must match the host interface signature
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> {
    readonly descriptor: FieldDescriptor;
  }
}
