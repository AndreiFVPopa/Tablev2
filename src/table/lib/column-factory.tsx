import { useLabels } from "@table/components/labels-context";
import {
  booleanFilterFn,
  dateRangeFilterFn,
  enumFilterFn,
  numberRangeFilterFn,
  tagsFilterFn,
  textFilterFn,
} from "@table/filters/filter-functions";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";
import { isSortableKind } from "@table/schema/index";

import { formatValue } from "./format-value";
import { getValueAtPath } from "./get-value-at-path";

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
    enableSorting: isSortableKind(descriptor.kind),
    enableColumnFilter: true,
    filterFn: filterFnForKind<TData>(descriptor.kind),
    sortDescFirst: false,
    ...(sortFn ? { sortFn } : {}),
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
    case FIELD_KINDS.DATE:
      return sortBasic;
    case FIELD_KINDS.BOOLEAN:
      return sortBoolean;
    case FIELD_KINDS.TAGS:
      return undefined;
  }
}
interface RowLike {
  getValue: (id: string) => unknown;
}
function sortText(a: RowLike, b: RowLike, columnId: string): number {
  const av = normaliseText(a.getValue(columnId));
  const bv = normaliseText(b.getValue(columnId));
  if (av === bv) return 0;
  if (av === "") return 1;
  if (bv === "") return -1;
  return av.localeCompare(bv);
}
function normaliseText(v: unknown): string {
  return typeof v === "string" ? v.toLocaleLowerCase() : "";
}
function sortBasic(a: RowLike, b: RowLike, columnId: string): number {
  const av = numericOf(a.getValue(columnId));
  const bv = numericOf(b.getValue(columnId));
  if (Number.isNaN(av) && Number.isNaN(bv)) return 0;
  if (Number.isNaN(av)) return 1;
  if (Number.isNaN(bv)) return -1;
  return av - bv;
}
function numericOf(v: unknown): number {
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  return Number.NaN;
}
function sortBoolean(a: RowLike, b: RowLike, columnId: string): number {
  return (a.getValue(columnId) === true ? 1 : 0) - (b.getValue(columnId) === true ? 1 : 0);
}
