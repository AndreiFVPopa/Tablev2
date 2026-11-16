import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";

import {
  canonicalKey,
  CANONICAL_KEYS,
  filterKey,
  isNamespacedKey,
  RANGE_SUBKEYS,
} from "./codec-keys";
import { parseSort, stringifySort, type UrlSortingState } from "./sort";
import { decodeFilterValue, encodeFilterValue, type EncodedFilterParts } from "./value-encoders";

import type { FieldDescriptor } from "../schema/index";

export type UrlColumnFiltersState = readonly {
  readonly id: string;
  readonly value: unknown;
}[];

export type SearchRecord = Readonly<Record<string, unknown>>;

export interface CodecTableState {
  readonly pagination: {
    readonly pageIndex: number;
    readonly pageSize: number;
  };
  readonly sorting: UrlSortingState;
  readonly columnFilters: UrlColumnFiltersState;
}

export interface CodecOptions {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
  readonly defaultPageSize: number;
  readonly pageSizes: readonly number[];
}

export type EncodedSearchValue = string | number | boolean;

export function encodeTableState(
  state: CodecTableState,
  options: CodecOptions,
): Record<string, EncodedSearchValue> {
  const encodedSearch: Record<string, EncodedSearchValue> = {};
  const urlNamespace = options.urlNamespace;
  encodedSearch[canonicalKey("page", urlNamespace)] = state.pagination.pageIndex + 1;
  encodedSearch[canonicalKey("pageSize", urlNamespace)] = state.pagination.pageSize;
  encodedSearch[canonicalKey("sort", urlNamespace)] = stringifySort(state.sorting);
  const filterValueById = new Map(state.columnFilters.map((filter) => [filter.id, filter.value]));
  for (const descriptor of options.fields) {
    const filterValue = filterValueById.get(descriptor.path);
    if (filterValue === undefined) continue;
    const parts = encodeFilterValue(filterValue, descriptor);
    writeFilterParts(encodedSearch, descriptor.path, parts, urlNamespace);
  }
  return encodedSearch;
}

function writeFilterParts(
  encodedSearch: Record<string, EncodedSearchValue>,
  path: string,
  parts: EncodedFilterParts,
  urlNamespace: string | undefined,
): void {
  if (parts.value !== undefined) {
    encodedSearch[filterKey(path, undefined, urlNamespace)] = parts.value;
  }
  if (parts.min !== undefined) {
    encodedSearch[filterKey(path, NUMBER_RANGE_BOUNDARY.MINIMUM, urlNamespace)] = parts.min;
  }
  if (parts.max !== undefined) {
    encodedSearch[filterKey(path, NUMBER_RANGE_BOUNDARY.MAXIMUM, urlNamespace)] = parts.max;
  }
  if (parts.from !== undefined) {
    encodedSearch[filterKey(path, DATE_RANGE_BOUNDARY.FROM, urlNamespace)] = parts.from;
  }
  if (parts.to !== undefined) {
    encodedSearch[filterKey(path, DATE_RANGE_BOUNDARY.TO, urlNamespace)] = parts.to;
  }
}

export function decodeTableState(search: SearchRecord, options: CodecOptions): CodecTableState {
  const urlNamespace = options.urlNamespace;
  const pagination = decodePagination(search, urlNamespace, options);
  const sorting = parseSort(search[canonicalKey("sort", urlNamespace)]);
  const columnFilters = decodeAllFilters(search, options, urlNamespace);
  return {
    pagination,
    sorting,
    columnFilters,
  };
}

function decodePagination(
  search: SearchRecord,
  urlNamespace: string | undefined,
  options: CodecOptions,
): {
  pageIndex: number;
  pageSize: number;
} {
  const pageInput = search[canonicalKey("page", urlNamespace)];
  const pageSizeInput = search[canonicalKey("pageSize", urlNamespace)];
  const pageNumber = toPositiveInt(pageInput) ?? 1;
  const pageSizeValue = toPositiveInt(pageSizeInput) ?? options.defaultPageSize;
  const clampedPageSize = options.pageSizes.includes(pageSizeValue)
    ? pageSizeValue
    : options.defaultPageSize;
  return { pageIndex: Math.max(0, pageNumber - 1), pageSize: clampedPageSize };
}

function decodeAllFilters(
  search: SearchRecord,
  options: CodecOptions,
  urlNamespace: string | undefined,
): UrlColumnFiltersState {
  const columnFilters: { id: string; value: unknown }[] = [];
  for (const descriptor of options.fields) {
    const parts = collectParts(search, descriptor.path, urlNamespace);
    const filterValue = decodeFilterValue(parts, descriptor);
    if (filterValue !== undefined) {
      columnFilters.push({ id: descriptor.path, value: filterValue });
    }
  }
  return columnFilters;
}

function collectParts(
  search: SearchRecord,
  path: string,
  urlNamespace: string | undefined,
): EncodedFilterParts {
  const withValue = collectValuePart(search[filterKey(path, undefined, urlNamespace)]);
  return RANGE_SUBKEYS.reduce<EncodedFilterParts>((accumulatedParts, rangeSubKey) => {
    const inputValue = search[filterKey(path, rangeSubKey, urlNamespace)];
    if (
      rangeSubKey === NUMBER_RANGE_BOUNDARY.MINIMUM ||
      rangeSubKey === NUMBER_RANGE_BOUNDARY.MAXIMUM
    ) {
      const numericValue = coerceFiniteNumber(inputValue);
      return numericValue === undefined
        ? accumulatedParts
        : { ...accumulatedParts, [rangeSubKey]: numericValue };
    }
    const stringValue = coerceString(inputValue);
    return stringValue === undefined
      ? accumulatedParts
      : { ...accumulatedParts, [rangeSubKey]: stringValue };
  }, withValue);
}

function collectValuePart(inputValue: unknown): EncodedFilterParts {
  if (typeof inputValue === "boolean") return { value: inputValue };
  const asString = coerceString(inputValue);
  return asString === undefined ? {} : { value: asString };
}

export function canonicaliseSearch(
  search: SearchRecord,
  options: CodecOptions,
): Record<string, unknown> {
  const decoded = decodeTableState(search, options);
  const encoded = encodeTableState(decoded, options);
  const preserved = stripTableKeys(search, options);
  return { ...preserved, ...encoded };
}

export function stripTableKeys(
  search: SearchRecord,
  options: CodecOptions,
): Record<string, unknown> {
  const urlNamespace = options.urlNamespace;
  const tableKeys = new Set(allTableKeys(options));
  const preserved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(search)) {
    if (!isNamespacedKey(key, urlNamespace)) {
      preserved[key] = value;
      continue;
    }
    if (!tableKeys.has(key)) {
      preserved[key] = value;
    }
  }
  return preserved;
}

function allTableKeys(options: CodecOptions): string[] {
  const urlNamespace = options.urlNamespace;
  const keys: string[] = CANONICAL_KEYS.map((key) => canonicalKey(key, urlNamespace));
  for (const descriptor of options.fields) {
    keys.push(filterKey(descriptor.path, undefined, urlNamespace));
    for (const rangeSubKey of RANGE_SUBKEYS) {
      keys.push(filterKey(descriptor.path, rangeSubKey, urlNamespace));
    }
  }
  return keys;
}

function toPositiveInt(inputValue: unknown): number | undefined {
  if (typeof inputValue === "number" && Number.isInteger(inputValue) && inputValue >= 1) {
    return inputValue;
  }
  if (typeof inputValue === "string" && inputValue.trim() !== "") {
    const numericValue = Number(inputValue);
    if (Number.isInteger(numericValue) && numericValue >= 1) return numericValue;
  }
  return undefined;
}

function coerceString(inputValue: unknown): string | undefined {
  if (typeof inputValue === "string") return inputValue;
  if (typeof inputValue === "number" && Number.isFinite(inputValue)) return String(inputValue);
  return undefined;
}

function coerceFiniteNumber(inputValue: unknown): number | undefined {
  if (typeof inputValue === "number") {
    return Number.isFinite(inputValue) ? inputValue : undefined;
  }
  if (typeof inputValue === "string" && inputValue.trim() !== "") {
    const numericValue = Number(inputValue);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }
  return undefined;
}

export function shallowEqual(left: SearchRecord, right: SearchRecord): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!Object.hasOwn(right, key)) return false;
    if (left[key] !== right[key]) return false;
  }
  return true;
}
