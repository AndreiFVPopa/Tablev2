import type { FieldDescriptor } from "@table/schema/index";
export interface FilterComponentProps<D extends FieldDescriptor, V> {
  readonly descriptor: D;
  readonly value: V | undefined;
  readonly onChange: (nextValue: V | undefined) => void;
}
