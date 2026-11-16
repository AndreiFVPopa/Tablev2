import { sortFn_basic, sortFn_datetime } from "@tanstack/react-table";

import { useLabels } from "@table/components/labels-context";
import {
  booleanFilterFn,
  dateRangeFilterFn,
  enumFilterFn,
  numberRangeFilterFn,
  tagsFilterFn,
  textFilterFn,
} from "@table/filters/shared/filter-functions";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import { formatValue } from "./format-value";
import { getValueAtPath } from "./get-value-at-path";
import { sortText } from "./sort-functions";

import type { TableFeaturesConfig } from "./table-features";
import type { FieldDescriptor, FieldKind } from "@table/schema/index";
import type { ColumnDef, RowData, SortFn } from "@tanstack/react-table";

export type TableColumnDef<TData extends RowData> = ColumnDef<TableFeaturesConfig, TData>;

export function buildColumnsFromDescriptors<TData extends RowData>(
  descriptors: readonly FieldDescriptor[],
): TableColumnDef<TData>[] {
  return descriptors.filter((d) => !d.meta.hidden).map((d) => buildColumn<TData>(d));
}

function buildColumn<TData extends RowData>(descriptor: FieldDescriptor): TableColumnDef<TData> {
  const sortFn = sortFnForKind<TData>(descriptor.kind);
  return {
    id: descriptor.path,
    accessorFn: (row) => getValueAtPath(row, descriptor.segments),
    header: descriptor.meta.title,
    cell: (info) => <FormattedCell value={info.getValue()} descriptor={descriptor} />,
    enableSorting: sortFn !== undefined,
    enableColumnFilter: true,
    filterFn: filterFnForKind<TData>(descriptor.kind),
    sortDescFirst: false,
    ...(sortFn !== undefined ? { sortFn } : {}),
    meta: { descriptor },
  };
}

function FormattedCell({
  value,
  descriptor,
}: {
  readonly value: unknown;
  readonly descriptor: FieldDescriptor;
}): React.JSX.Element {
  const labels = useLabels();
  return <>{formatValue(value, descriptor, labels)}</>;
}

function filterFnForKind<TData extends RowData>(kind: FieldKind) {
  switch (kind) {
    case FIELD_KINDS.TEXT:
      return textFilterFn<TData>();
    case FIELD_KINDS.NUMERIC:
      return numberRangeFilterFn<TData>();
    case FIELD_KINDS.ENUM:
      return enumFilterFn<TData>();
    case FIELD_KINDS.BOOLEAN:
      return booleanFilterFn<TData>();
    case FIELD_KINDS.TAGS:
      return tagsFilterFn<TData>();
    case FIELD_KINDS.DATE:
      return dateRangeFilterFn<TData>();
  }
}

function sortFnForKind<TData extends RowData>(
  kind: FieldKind,
): SortFn<TableFeaturesConfig, TData> | undefined {
  switch (kind) {
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.ENUM:
      return sortText;
    case FIELD_KINDS.NUMERIC:
    case FIELD_KINDS.BOOLEAN:
      return sortFn_basic;
    case FIELD_KINDS.DATE:
      return sortFn_datetime;
    case FIELD_KINDS.TAGS:
      return undefined;
  }
}
