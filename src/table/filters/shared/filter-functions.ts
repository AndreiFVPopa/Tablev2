import {
  parseBooleanFilterValue,
  parseDateRangeFilterValue,
  parseEnumFilterValue,
  parseNumberRangeFilterValue,
  parseTagsFilterValue,
  parseTextFilterValue,
} from "./parse-filter-value";

import type { TableFeaturesConfig } from "../../lib/table-features";
import type {
  BooleanFilterValue,
  DateRangeFilterValue,
  EnumFilterValue,
  NumberRangeFilterValue,
  TagsFilterValue,
} from "./filter-values.types";
import type { FilterFn, RowData } from "@tanstack/react-table";

export function matchText(cell: unknown, filter: string): boolean {
  if (filter === "") return true;
  const needle = filter.toLocaleLowerCase();
  if (typeof cell === "string") return cell.toLocaleLowerCase().includes(needle);
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return cell.toString().toLocaleLowerCase().includes(needle);
  }
  return false;
}

export function matchNumberRange(cell: unknown, filter: NumberRangeFilterValue): boolean {
  if (filter.min === undefined && filter.max === undefined) return true;
  if (typeof cell !== "number" || !Number.isFinite(cell)) return false;
  if (filter.min !== undefined && cell < filter.min) return false;
  if (filter.max !== undefined && cell > filter.max) return false;
  return true;
}

export function matchEnum(cell: unknown, filter: EnumFilterValue): boolean {
  if (filter === null || filter === "") return true;
  return cell === filter;
}

export function matchBoolean(cell: unknown, filter: BooleanFilterValue): boolean {
  if (filter === null) return true;
  return cell === filter;
}

export function matchTags(cell: unknown, filter: TagsFilterValue): boolean {
  if (filter.length === 0) return true;
  if (!Array.isArray(cell)) return false;
  const haystack = cell.filter((entry): entry is string => typeof entry === "string");
  return filter.some((needle) => haystack.includes(needle));
}

export function matchDateRange(cell: unknown, filter: DateRangeFilterValue): boolean {
  if (!filter.from && !filter.to) return true;
  if (!(cell instanceof Date) || Number.isNaN(cell.getTime())) return false;
  const cellMs = cell.getTime();
  if (filter.from) {
    const start = new Date(filter.from);
    if (Number.isNaN(start.getTime()) || cellMs < start.getTime()) return false;
  }
  if (filter.to) {
    const end = new Date(filter.to);
    if (Number.isNaN(end.getTime())) return false;
    end.setHours(23, 59, 59, 999);
    if (cellMs > end.getTime()) return false;
  }
  return true;
}

function rememberParse<T>(
  parse: (value: unknown) => T | undefined,
): (value: unknown) => T | undefined {
  let hasPrevious = false;
  let previous: unknown;
  let parsed: T | undefined;
  return (value) => {
    if (hasPrevious && Object.is(value, previous)) return parsed;
    hasPrevious = true;
    previous = value;
    parsed = parse(value);
    return parsed;
  };
}

function filterRows<TData extends RowData, TFilter>(
  parse: (value: unknown) => TFilter | undefined,
  match: (cell: unknown, filter: TFilter) => boolean,
): FilterFn<TableFeaturesConfig, TData> {
  const parseFilter = rememberParse(parse);
  // eslint-disable-next-line max-params -- TanStack Table FilterFn requires (row, columnId, filterValue)
  return (row, columnId, value) => {
    const filter = parseFilter(value);
    return filter === undefined ? true : match(row.getValue(columnId), filter);
  };
}

export function textFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseTextFilterValue, matchText);
}

export function numberRangeFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseNumberRangeFilterValue, matchNumberRange);
}

export function enumFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseEnumFilterValue, matchEnum);
}

export function booleanFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseBooleanFilterValue, matchBoolean);
}

export function tagsFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseTagsFilterValue, matchTags);
}

export function dateRangeFilterFn<TData extends RowData>(): FilterFn<TableFeaturesConfig, TData> {
  return filterRows(parseDateRangeFilterValue, matchDateRange);
}
