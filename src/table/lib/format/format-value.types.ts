import type { FieldDescriptor } from "@table/schema/descriptors";
import type { TableLabels } from "@table/table-labels.types";

export interface FormatValueInput {
  readonly value: unknown;
  readonly descriptor: FieldDescriptor;
  readonly labels: TableLabels;
}

export interface FormatLabeledValueInput {
  readonly value: unknown;
  readonly optionLabels: Readonly<Record<string, string>> | undefined;
  readonly labels: TableLabels;
}
